import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

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
      const pandocPath = process.env.VERCEL
        ? path.join(process.cwd(), 'dist/bin/pandoc')
        : 'pandoc';

      console.log(`[PANDOC DEBUG] Env VERCEL: ${process.env.VERCEL}`);
      console.log(`[PANDOC DEBUG] CWD: ${process.cwd()}`);
      console.log(`[PANDOC DEBUG] Target Path: ${pandocPath}`);

      if (process.env.VERCEL) {
        if (fs.existsSync(pandocPath)) {
          console.log('[PANDOC DEBUG] Binary exists at path.');
          try {
            await fs.promises.access(pandocPath, fs.constants.X_OK);
            console.log('[PANDOC DEBUG] Binary is executable.');
          } catch (e) {
            console.log(
              '[PANDOC DEBUG] Binary is NOT executable (access X_OK failed):',
              e.message,
            );
          }
        } else {
          console.log('[PANDOC DEBUG] Binary DOES NOT exist at path.');
          // List dist/bin contents
          const binDir = path.dirname(pandocPath);
          if (fs.existsSync(binDir)) {
            console.log(
              `[PANDOC DEBUG] Listing ${binDir}:`,
              fs.readdirSync(binDir),
            );
          } else {
            console.log(`[PANDOC DEBUG] Directory ${binDir} does not exist.`);
          }
        }
      }

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
