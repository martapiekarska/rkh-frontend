export interface Wallet {
    type: string;
    sign: (message: any, indexAccount: number) => Promise<string>;
    getAccounts: () => Promise<string[]>;
}