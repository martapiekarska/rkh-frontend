// @ts-ignore
import FilecoinApp from "@zondax/ledger-filecoin";
import { Wallet } from "@/types/wallet";

// Import the signer as a dynamic import
const signerPromise = import("@zondax/filecoin-signing-tools/js").then(module => module.transactionSerialize);

interface LedgerAccount {
    address: string;
    index: number;
    path: string;
}

export class LedgerWallet implements Wallet {
    type = "ledger";

    private filecoinApp: FilecoinApp;
    private address: string;

    constructor(filecoinApp: FilecoinApp, address: string) {
        this.filecoinApp = filecoinApp;
        this.address = address;
    }

    async sign(message: any, indexAccount: number) {
        const transactionSerialize = await signerPromise;
        const serializedMessage = transactionSerialize(this.generateSignableMessage(message));

        const signedMessage = this.handleErrors(
            await this.filecoinApp.sign(`m/44'/461'/0'/0/${indexAccount}`, Buffer.from(serializedMessage, 'hex'))
        );
      
        return await this.generateSignedMessage(message, signedMessage);
    }

    async getAccounts(): Promise<string[]> {
        const accounts: LedgerAccount[] = [];
        for (let i = 0; i < 5; i++) {
            const path = `m/44'/461'/0'/0/${i}`;
            const { addrString } = await this.filecoinApp.getAddressAndPubKey(path);
            accounts.push({ address: addrString, index: i, path });
        }
        
        return accounts.map((account) => account.address);
    }

    private generateSignableMessage = (filecoinMessage: any) => {
        return {
            From: filecoinMessage.from,
            GasLimit: filecoinMessage.gaslimit,
            GasFeeCap: filecoinMessage.gasfeecap,
            GasPremium: filecoinMessage.gaspremium,
            Method: filecoinMessage.method,
            Nonce: filecoinMessage.nonce,
            Params: Buffer.from(filecoinMessage.params, "hex").toString("base64"),
            To: filecoinMessage.to,
            Value: filecoinMessage.value,
        }
    }

    private generateSignedMessage = async (filecoinMessage: any, signedMessage: any) => {
        return JSON.stringify({
            Message: this.generateSignableMessage(filecoinMessage),
            Signature: {
                Data: signedMessage.signature_compact.toString('base64'),
                Type: 1
            },
        });
    }

    private handleErrors = (response: any) => {
        if (response.error_message && response.error_message.toLowerCase().includes('no errors')) {
            return response;
        }
        if (response.error_message && response.error_message.toLowerCase().includes('transporterror: invalild channel')) {
            throw new Error('Lost connection with Ledger. Please unplug and replug device.');
        }
        throw new Error(response.error_message);
    }
}