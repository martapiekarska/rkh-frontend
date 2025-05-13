import { Wallet } from '@/types/wallet';
import { FilsnapAdapter } from 'filsnap-adapter';

export class FilsnapWallet implements Wallet {
    type = "filsnap";

    private adapter: FilsnapAdapter;
    private address: string;

    constructor(adapter: FilsnapAdapter, address: string) {
        this.adapter = adapter;
        this.address = address;
    }

    async sign(message: any, indexAccount: number): Promise<string> {
        const { error, result } = await this.adapter.signMessage(
            {
                value: message.Value,
                to: message.To,
                params: message.Params,
                method: message.Method,
                version: message.Version,
                nonce: message.Nonce,
                gasLimit: message.GasLimit,
                gasFeeCap: message.GasFeeCap,
                gasPremium: message.GasPremium
            }
        );
        if (error) {
            throw new Error(`Failed to sign message: ${error}`);
        }
        return result.signature.data;
    }

    async getAccounts(): Promise<string[]> {
        const { error, result: address } = await this.adapter.getAddress();
        if (error) {
            throw new Error(`Failed to get address: ${error}`);
        }
        // Filsnap currently supports only one account per connection
        return [address];
    }
}
