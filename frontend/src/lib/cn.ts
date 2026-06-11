/**
 * ==================================
 * eLISAschool - Utilitaire cn()
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Fusion de classes Tailwind CSS avec clsx + tailwind-merge
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}
