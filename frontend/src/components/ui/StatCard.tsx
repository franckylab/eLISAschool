import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange' | 'gray';
    delay?: number;
    subtitle?: string;
    loading?: boolean;
}

const COLORS: Record<string, { bg: string; text: string; value: string }> = {
    blue: { bg: 'from-blue-50 to-blue-100 border-blue-200', text: 'text-blue-700', value: 'text-blue-800' },
    green: { bg: 'from-green-50 to-green-100 border-green-200', text: 'text-green-700', value: 'text-green-800' },
    purple: { bg: 'from-purple-50 to-purple-100 border-purple-200', text: 'text-purple-700', value: 'text-purple-800' },
    yellow: { bg: 'from-yellow-50 to-yellow-100 border-yellow-200', text: 'text-yellow-700', value: 'text-yellow-800' },
    red: { bg: 'from-red-50 to-red-100 border-red-200', text: 'text-red-700', value: 'text-red-800' },
    orange: { bg: 'from-orange-50 to-orange-100 border-orange-200', text: 'text-orange-700', value: 'text-orange-800' },
    gray: { bg: 'from-gray-50 to-gray-100 border-gray-200', text: 'text-gray-700', value: 'text-gray-800' },
};

export function StatCard({ icon: Icon, label, value, color = 'blue', delay = 0, subtitle, loading }: StatCardProps) {
    const c = COLORS[color] || COLORS.blue;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className={`bg-gradient-to-br ${c.bg} rounded-xl p-5 border ${loading ? 'animate-pulse' : ''}`}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${c.bg.replace('from-', 'bg-').split(' ')[0]}`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <span className={`text-sm font-medium ${c.text}`}>{label}</span>
            </div>
            {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-2" />
            ) : (
                <>
                    <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </>
            )}
        </motion.div>
    );
}
