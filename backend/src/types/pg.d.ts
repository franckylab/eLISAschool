declare module 'pg' {
    interface ClientConfig {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        database?: string;
        ssl?: any;
    }
    class Client {
        constructor(config?: ClientConfig);
        connect(): Promise<void>;
        query(text: string, values?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
        end(): Promise<void>;
    }
    export { Client, ClientConfig };
}