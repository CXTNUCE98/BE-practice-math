import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as cheerio from 'cheerio';

const exec = promisify(execFile);

/**
 * Service để xử lý conversion từ DOCX sang HTML + LaTeX sử dụng Pandoc
 */
@Injectable()
export class PandocService {
  /**
   * Chuyển đổi file DOCX sang HTML với công thức toán dạng LaTeX
   * @param duongDanFile - Đường dẫn tuyệt đối đến file DOCX
   * @returns HTML string với công thức toán được wrap trong LaTeX delimiters ($...$)
   */
  async chuyenDoiDocxSangHtml(duongDanFile: string): Promise<string> {
    try {
      // Gọi Pandoc CLI với các options:
      // -t html: output format là HTML
      // --mathjax: convert math equations sang LaTeX format
      // --wrap=none: không wrap lines (giữ nguyên formatting)
      const pandocPath = process.env.VERCEL
        ? path.join(process.cwd(), 'dist/bin/pandoc')
        : 'pandoc';
      const { stdout } = await exec(
        pandocPath,
        [
          duongDanFile,
          '-t',
          'html',
          '--standalone',
          '--embed-resources',
          '--mathjax',
          '--wrap=none',
        ],
        {
          maxBuffer: 50 * 1024 * 1024, // 50MB limit cho các file nhiều ảnh base64
        },
      );

      return stdout;
    } catch (loi: unknown) {
      const errorMessage = loi instanceof Error ? loi.message : String(loi);
      console.error('[PANDOC] Lỗi khi convert DOCX:', errorMessage);
      throw new Error(`Không thể convert DOCX: ${errorMessage}`);
    }
  }

  /**
   * Trích xuất và chuyển đổi LaTeX từ HTML output của Pandoc
   * Pandoc output math dạng: <span class="math inline">\(...\)</span>
   * Ta sẽ convert sang: $...$
   * @param html - HTML string từ Pandoc
   * @returns HTML với LaTeX delimiters chuẩn
   */
  trichXuatLatex(html: string): string {
    const $ = cheerio.load(html);

    // Xử lý inline math: \(...\) → $...$
    $('.math.inline').each((_, el) => {
      const latexContent = $(el).text();
      // Remove \( và \) delimiters
      const cleanLatex = latexContent.replace(/^\\\(/, '').replace(/\\\)$/, '');
      $(el).replaceWith(`$${cleanLatex}$`);
    });

    // Xử lý display math: \[...\] → $$...$$
    $('.math.display').each((_, el) => {
      const latexContent = $(el).text();
      // Remove \[ và \] delimiters
      const cleanLatex = latexContent.replace(/^\\\[/, '').replace(/\\\]$/, '');
      $(el).replaceWith(`$$${cleanLatex}$$`);
    });

    // Return HTML body content (không có tags <html>, <head>, <body>)
    return $('body').html() || $.html();
  }

  /**
   * Helper method để convert DOCX file sang HTML + LaTeX trong một bước
   * @param duongDanFile - Đường dẫn tuyệt đối đến file DOCX
   * @returns HTML với LaTeX delimiters chuẩn ($...$)
   */
  async convertDocxToLatexHtml(duongDanFile: string): Promise<string> {
    const htmlThoCuaPandoc = await this.chuyenDoiDocxSangHtml(duongDanFile);
    const htmlVoiLatex = this.trichXuatLatex(htmlThoCuaPandoc);
    return htmlVoiLatex;
  }
}
