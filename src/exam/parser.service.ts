import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { PandocService } from './pandoc.service';

// Sử dụng require để tránh các vấn đề về kiểu dữ liệu với node-canvas và wmf
const WMF = require('wmf');
const { createCanvas } = require('canvas');

interface ParsedQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
}

/**
 * Service phân tích và xử lý file DOCX thành câu hỏi trắc nghiệm
 */
@Injectable()
export class ParserService {
  // Sử dụng /tmp cho serverless environment (Vercel, AWS Lambda)
  // hoặc os.tmpdir() cho local development
  private readonly tempDuongDan =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? '/tmp'
      : path.join(os.tmpdir(), 'practice-math');

  constructor(private readonly pandocService: PandocService) {
    // Tạo thư mục temp nếu chưa tồn tại (chỉ cần cho local)
    if (!fs.existsSync(this.tempDuongDan)) {
      fs.mkdirSync(this.tempDuongDan, { recursive: true });
    }
  }

  /**
   * Phân tích nội dung file docx và trả về danh sách câu hỏi
   */
  async parseDocx(fileBuffer: Buffer): Promise<ParsedQuestion[]> {
    console.log('--- START PANDOC CONVERSION ---');

    let tempFilePath: string | null = null;

    try {
      // Bước 1: Lưu buffer ra temp file
      tempFilePath = await this.luuFileTemp(fileBuffer);
      console.log(`[PANDOC] Saved temp file: ${tempFilePath}`);

      // Bước 2: Gọi Pandoc service để convert
      const html =
        await this.pandocService.convertDocxToLatexHtml(tempFilePath);
      console.log(`[PANDOC] Converted to HTML + LaTeX (${html.length} chars)`);

      // Bước 3: Parse HTML để extract câu hỏi
      const questions = this.extractQuestionsFromHtml(html);
      console.log(`[PANDOC] Extracted ${questions.length} questions`);

      // Bước 4: Trích xuất bảng đáp án
      const answerKey = this.extractAnswersFromHtml(html);
      console.log(
        `[PANDOC] Extracted ${Object.keys(answerKey).length} answers from key`,
      );

      // Bước 5: Map đáp án vào câu hỏi
      if (Object.keys(answerKey).length > 0) {
        questions.forEach((q, index) => {
          const questionNum = index + 1;
          if (answerKey[questionNum] !== undefined) {
            q.correctAnswer = answerKey[questionNum];
          }
        });
      }

      return questions;
    } catch (loi: unknown) {
      const errorMessage = loi instanceof Error ? loi.message : String(loi);
      console.error('[PANDOC] Parse error:', errorMessage);
      throw loi;
    } finally {
      // Bước 4: Cleanup temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
        console.log(`[PANDOC] Cleaned up temp file: ${tempFilePath}`);
      }
    }
  }

  /**
   * Lưu file buffer ra temp file và return đường dẫn
   */
  private async luuFileTemp(buffer: Buffer): Promise<string> {
    const tenFile = `${uuidv4()}.docx`;
    const duongDan = path.join(this.tempDuongDan, tenFile);
    await fs.promises.writeFile(duongDan, buffer);
    return duongDan;
  }

  /**
   * Trích xuất câu hỏi từ HTML đã được convert
   */
  private extractQuestionsFromHtml(html: string): ParsedQuestion[] {
    const $ = cheerio.load(html);
    const questions: ParsedQuestion[] = [];

    let currentQuestion: { contentHtml: string } | null = null;
    let inSolutionSection = false;

    // Duyệt qua các thẻ cấp cao nhất của body để giữ nguyên cấu trúc Table/List
    $('body')
      .children()
      .each((_, element) => {
        const $el = $(element);
        const text = $el.text().trim();
        const rawHtml = $.html($el) || ''; // Lấy toàn bộ HTML của block (p, table, ul, ol...)
        const hasImage = $el.find('img').length > 0;

        // Không bỏ qua nếu block có nội dung hoặc có chứa ảnh hoặc table
        const isActuallyEmpty =
          !text && !hasImage && !$el.is('table') && !rawHtml.includes('<');
        if (isActuallyEmpty) return;

        // Loại bỏ các đoạn văn metadata phổ biến
        if (
          text.match(
            /GVSB|GVPB|Email|Ma\s*trận|Người\s*soạn|Số\s*báo\s*danh|Trang\s+\d+|Mã\s*đề/i,
          )
        ) {
          return;
        }

        // Kiểm tra marker "BẢNG ĐÁP ÁN" để dừng trích xuất câu hỏi
        if (text.match(/BẢNG\s*ĐÁP\s*ÁN/i)) {
          if (currentQuestion) {
            this.finalizeAndPushQuestion(questions, currentQuestion);
            currentQuestion = null;
          }
          return false; // Dừng loop mỗi khi gặp bảng đáp án
        }

        // Kiểm tra marker "PHẦN" để ngắt
        if (text.match(/^PHẦN\s+[IVXLCDM]+/i)) {
          if (currentQuestion) {
            this.finalizeAndPushQuestion(questions, currentQuestion);
            currentQuestion = null;
          }
          return;
        }

        // Kiểm tra marker câu hỏi mới
        const questionMatch =
          text.match(/^(Câu|Câu hỏi|Câu số)\s+\d+[:.;\s]*/i) &&
          !text.match(/trả\s*lời\s*từ\s*câu/i) &&
          !text.match(/đáp\s*án\s*chi\s*tiết/i);

        if (questionMatch) {
          if (currentQuestion) {
            this.finalizeAndPushQuestion(questions, currentQuestion);
          }

          inSolutionSection = false;
          currentQuestion = {
            contentHtml: rawHtml,
          };
        } else if (currentQuestion) {
          // Kiểm tra marker "Lời giải"
          if (
            text.match(/^Lời\s*giải[:.;\s]*$/i) ||
            text.match(/^Hướng\s*dẫn\s*giải[:.;\s]*$/i)
          ) {
            inSolutionSection = true;
            return;
          }

          if (!inSolutionSection) {
            currentQuestion.contentHtml += rawHtml;
          }
        }
      });

    if (currentQuestion) {
      this.finalizeAndPushQuestion(questions, currentQuestion);
    }

    return questions;
  }

  private finalizeAndPushQuestion(
    questions: ParsedQuestion[],
    q: { contentHtml: string },
  ) {
    let html = q.contentHtml;

    // Cắt bỏ phần sau marker "Lời giải"
    const solutionIndex = html.search(/Lời\s*giải/i);
    if (solutionIndex !== -1) {
      html = html.substring(0, solutionIndex);
    }

    // Regex linh hoạt nhưng an toàn hơn cho marker A, B, C, D
    // Không dùng lookahead quá phức tạp gây nuốt/miss ký tự
    const markerRegex =
      /(?:^|>|\s|&nbsp;|[(（[])(?:\s*<(?:strong|span|b|i|em)[^>]*>\s*)*([A-D]|[a-d])(?:\s*<\/(?:strong|span|b|i|em)>\s*)*\s*[.:)\]}](?:\s*<\/(?:strong|span|b|i|em)>\s*)*/gi;
    const markerPositions: {
      marker: string;
      index: number;
      fullMatch: string;
    }[] = [];

    let match: RegExpExecArray | null;
    while ((match = markerRegex.exec(html)) !== null) {
      const char = match[1].toUpperCase();
      const expectedChar =
        markerPositions.length === 0
          ? 'A'
          : String.fromCharCode('A'.charCodeAt(0) + markerPositions.length);

      if (char === expectedChar && markerPositions.length < 4) {
        markerPositions.push({
          marker: char,
          index: match.index,
          fullMatch: match[0],
        });
      }
    }

    const options: string[] = [];
    let questionContent = '';

    if (markerPositions.length > 0) {
      questionContent = html.substring(0, markerPositions[0].index).trim();

      for (let i = 0; i < markerPositions.length; i++) {
        const start =
          markerPositions[i].index + markerPositions[i].fullMatch.length;
        const end = markerPositions[i + 1]
          ? markerPositions[i + 1].index
          : html.length;
        const optHtml = html.substring(start, end);
        const cleanOpt = this.cleanHtml(optHtml);
        options.push(cleanOpt);
      }
    } else {
      questionContent = html.trim();
    }

    // Làm sạch "Câu X:"
    const $content = cheerio.load(questionContent);
    let finalContent = questionContent;

    let markerRemoved = false;
    const removeQuestionMarker = (el: any) => {
      const children = $content(el).contents();
      for (let i = 0; i < children.length; i++) {
        const node = children[i] as any;
        if (node.type === 'text') {
          const text = $content(node).text();
          if (text.trim().match(/^(Câu|Câu hỏi|Câu số)\s+\d+[:.;\s]*/i)) {
            $content(node).replaceWith(
              text.replace(/^\s*(Câu|Câu hỏi|Câu số)\s+\d+[:.;\s]*/i, ''),
            );
            markerRemoved = true;
            return;
          } else if (text.trim().length > 0) {
            return;
          }
        } else if (node.type === 'tag') {
          removeQuestionMarker(node);
          if (markerRemoved) return;
        }
      }
    };

    const firstElement = $content('body').children().first();
    if (firstElement.length > 0) {
      removeQuestionMarker(firstElement);
      finalContent = $content('body').html() || '';
    } else {
      finalContent = finalContent.replace(
        /^\s*(Câu|Câu hỏi|Câu số)\s+\d+[:.;\s]*/i,
        '',
      );
    }

    finalContent = this.cleanHtml(finalContent);
    finalContent = this.decodeLatexEntities(finalContent);

    while (options.length < 4) options.push('');

    const cleanTextOnly = cheerio.load(finalContent).text().trim();

    if (
      cleanTextOnly.length > 5 ||
      options.filter((o) => o.trim().length > 0).length >= 2
    ) {
      questions.push({
        content: finalContent,
        options: options.slice(0, 4).map((o) => {
          const cleaned = this.cleanHtml(o);
          return this.decodeLatexEntities(cleaned);
        }),
        correctAnswer: 0,
      });
    }
  }

  /**
   * Giải mã các HTML entities (như &lt;) bên trong các khối LaTeX $...$
   */
  private decodeLatexEntities(text: string): string {
    if (!text) return '';
    return text.replace(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g, (match) => {
      return match
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    });
  }

  private cleanHtml(html: string): string {
    if (!html) return '';

    // Chuyển đổi các ảnh WMF (không hiển thị được trên web) sang PNG
    const processedHtml = this.processWmfImages(html);

    const cleaned = processedHtml.trim();

    const $ = cheerio.load(cleaned, { xmlMode: false }, false);

    const removeEmptyTags = () => {
      let changed = false;
      $('strong, em, p, span, b, i').each((_, el) => {
        const text = $(el)
          .text()
          .replace(/\s|&nbsp;/g, '')
          .trim();
        const hasVisibleContent =
          text.length > 0 || $(el).find('img, table, sup, sub').length > 0;

        if (!hasVisibleContent) {
          $(el).remove();
          changed = true;
        }
      });
      if (changed) removeEmptyTags();
    };

    // Chuyển đổi sup/sub sang dạng văn bản nếu chúng chưa nằm trong LaTeX
    // (Vì KaTeX của chúng ta chỉ render nội dung trong dấu $)
    $('sup').each((_, el) => {
      const text = $(el).text();
      if (text) $(el).replaceWith(`^${text}`);
    });
    $('sub').each((_, el) => {
      const text = $(el).text();
      if (text) $(el).replaceWith(`_${text}`);
    });

    removeEmptyTags();

    // Lưu ý: Không dùng xmlMode để tránh tự đóng thẻ tùy tiện

    $('p').each((_, el) => {
      const innerHtml = $(el).html() || '';
      if (innerHtml.trim() === '') {
        $(el).remove();
      } else {
        $(el).html(innerHtml.trim());
      }
    });

    return $.html().trim();
  }

  /**
   * Quét HTML và chuyển đổi các ảnh WMF Base64 sang PNG Base64
   */
  private processWmfImages(html: string): string {
    const $ = cheerio.load(html, { xmlMode: false }, false);
    let hasWmf = false;

    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (
        src.startsWith('data:image/x-wmf') ||
        src.startsWith('data:image/wmf')
      ) {
        hasWmf = true;
        try {
          const base64Data = src.split(',')[1];
          if (!base64Data) return;

          const buffer = Buffer.from(base64Data, 'base64');
          const parsed = WMF.parse(buffer);

          // Word thường lưu kích thước ảnh theo một tỷ lệ lớn, ta cần cân đối lại
          // Nếu không có kích thước, mặc định là 600px cho bảng biểu
          const width = parsed.width || 600;
          const height = parsed.height || 200;

          const canvas = createCanvas(width, height);

          // Render WMF lên canvas
          WMF.render_canvas(parsed, canvas);

          // Xuất ra PNG base64
          const pngData = canvas.toDataURL('image/png');
          $(el).attr('src', pngData);

          // Gắn thêm class để frontend CSS nếu cần
          $(el).addClass('converted-math-image');
        } catch (error) {
          console.error('[WMF] Lỗi chuyển đổi ảnh:', error.message);
          // Giữ nguyên ảnh lỗi hoặc đánh dấu broken
        }
      }
    });

    return hasWmf ? $.html() : html;
  }

  /**
   * Trích xuất bảng đáp án từ HTML
   * Trả về object map STT câu hỏi -> Index đáp án (0-3)
   */
  private extractAnswersFromHtml(html: string): Record<number, number> {
    const $ = cheerio.load(html);
    const answerKey: Record<number, number> = {};

    const allText = $('body').text();

    // Tìm vị trí của "BẢNG ĐÁP ÁN"
    const answerSectionMatch = allText.match(/BẢNG\s*ĐÁP\s*ÁN/i);
    if (!answerSectionMatch) return {};

    // Thử tìm trong các bảng (Table) trước
    $('table').each((_, table) => {
      const tableText = $(table).text();
      if (
        tableText.match(/Câu/i) &&
        (tableText.match(/[A-D]/) || tableText.match(/[1-4]/))
      ) {
        $(table)
          .find('tr')
          .each((_, tr) => {
            const cells = $(tr).find('td, th');
            cells.each((i, td) => {
              const cellText = $(td).text().trim();
              // Format: "1.A" hoặc "Câu 1: A" hoặc ô STT = 1, ô Đáp án = A
              const match = cellText.match(/(\d+)[:.\s-]*([A-D])/i);
              if (match) {
                const qNum = parseInt(match[1], 10);
                const ans = match[2].toUpperCase().charCodeAt(0) - 65;
                answerKey[qNum] = ans;
              } else {
                // Check if this cell is a number and next cell is A-D
                const qNumVal = parseInt(cellText, 10);
                if (!isNaN(qNumVal)) {
                  const nextCellText = $(cells[i + 1])
                    .text()
                    .trim();
                  const ansMatch = nextCellText.match(/^[A-D]$/i);
                  if (ansMatch) {
                    answerKey[qNumVal] =
                      ansMatch[0].toUpperCase().charCodeAt(0) - 65;
                  }
                }
              }
            });
          });
      }
    });

    // Nếu vẫn chưa tìm được hoặc tìm thiếu, thử tìm ở text sau marker "BẢNG ĐÁP ÁN"
    if (Object.keys(answerKey).length === 0) {
      const parts = allText.split(/BẢNG\s*ĐÁP\s*ÁN/i);
      if (parts.length > 1) {
        const afterMarker = parts[parts.length - 1];
        // Tìm các cụm 1.A, 2-B, 3 C...
        const regex = /(\d+)[\s.:-]*([A-D])/gi;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(afterMarker)) !== null) {
          const qNum = parseInt(m[1], 10);
          const ans = m[2].toUpperCase().charCodeAt(0) - 65;
          answerKey[qNum] = ans;
        }
      }
    }

    return answerKey;
  }
}
