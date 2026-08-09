/**
 * ==================================
 * eLISAschool - Provider Backup Local
 * ==================================
 * 
 * Stockage des backups sur le filesystem local.
 * 
 * Phase 9.1 — Refonte SaaS
 */

import * as fs from 'fs';
import * as path from 'path';
import { BackupProvider, BackupFile, BackupResult, RestoreResult } from './backup-provider.interface';

export class LocalBackupProvider implements BackupProvider {
    readonly name = 'local';
    readonly displayName = 'Stockage local';

    async upload(filePath: string, fileName: string, credentials: Record<string, any>): Promise<BackupResult> {
        try {
            const backupDir = credentials.backupDir || path.join(process.cwd(), 'backups');
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const destPath = path.join(backupDir, fileName);
            fs.copyFileSync(filePath, destPath);

            const stats = fs.statSync(destPath);

            return {
                success: true,
                path: destPath,
                size: stats.size,
                message: 'Backup sauvegardé localement',
            };
        } catch (error: any) {
            return {
                success: false,
                message: `Erreur backup local: ${error.message}`,
            };
        }
    }

    async download(remotePath: string, localPath: string, _credentials: Record<string, any>): Promise<RestoreResult> {
        try {
            if (!fs.existsSync(remotePath)) {
                return { success: false, message: `Fichier introuvable: ${remotePath}` };
            }

            fs.copyFileSync(remotePath, localPath);
            return { success: true, message: 'Fichier restauré' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async list(credentials: Record<string, any>, prefix?: string): Promise<BackupFile[]> {
        const backupDir = credentials.backupDir || path.join(process.cwd(), 'backups');
        
        if (!fs.existsSync(backupDir)) {
            return [];
        }

        const files = fs.readdirSync(backupDir)
            .filter((f) => !prefix || f.startsWith(prefix))
            .map((f) => {
                const filePath = path.join(backupDir, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    path: filePath,
                };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return files;
    }

    async delete(remotePath: string, _credentials: Record<string, any>): Promise<boolean> {
        try {
            if (fs.existsSync(remotePath)) {
                fs.unlinkSync(remotePath);
            }
            return true;
        } catch {
            return false;
        }
    }

    estConfigure(_credentials: Record<string, any>): boolean {
        return true; // Toujours disponible (filesystem local)
    }
}
