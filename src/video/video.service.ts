import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';


@Injectable()
export class VideoService {
  async processVideo(file: Express.Multer.File) {
    const timestamp = Date.now().toString();

    const uploadsDir = path.join(process.cwd(), 'uploads');
    // Diretório temporário exclusivo desta execução
    // Aqui ficarão os frames extraídos do vídeo
    const tempDir = path.join(process.cwd(), 'temp', timestamp);
    const outputsDir = path.join(process.cwd(), 'outputs');

    const videoPath = path.join(uploadsDir, file.originalname);
    const zipPath = path.join(outputsDir, `frames_${timestamp}.zip`);

    // Garante que os diretórios existam
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(outputsDir, { recursive: true });

    // Salva o vídeo
    fs.writeFileSync(videoPath, file.buffer);
  // Executa o ffmpeg para extrair os frames do vídeo
  // Os frames serão gravados dentro do diretório temporário
    await this.extractFrames(videoPath, tempDir);
// Compacta todos os frames gerados em um único arquivo ZIP
  // O ZIP final será salvo em outputsDir
    await this.createZip(tempDir, zipPath);

    // Remove o diretório temporário contendo os frames
  // Após o ZIP ser criado, os frames não são mais necessários
    fs.unlinkSync(videoPath);
    fs.rmSync(tempDir, { recursive: true, force: true });
console.log('zipPath->', zipPath);

 // Retorna o caminho do ZIP para que o controller
  // possa enviá-lo como download na resposta da API
    return zipPath;
  }

  private extractFrames(videoPath: string, tempDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = `ffmpeg -i "${videoPath}" -vf fps=1 "${tempDir}/frame_%04d.png"`;

      exec(command, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private createZip(sourceDir: string, zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
    });
  }
}
