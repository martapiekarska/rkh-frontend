import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
// @ts-ignore
import FilecoinApp from "@zondax/ledger-filecoin";

import { fetchRole } from "@/lib/api";
import { Connector } from "@/types/connector";
import { Account } from "@/types/account";
import { LedgerWallet } from "../wallets/ledger-wallet";

export class LedgerConnector implements Connector {
  name = "ledger";
  private transport: any;
  private filecoinApp: any;
  private connected = false;
  private accountIndex = 0;
  private account: Account | null = null;

  constructor(accountIndex = 0) {
    this.accountIndex = accountIndex;
  }

  async connect(): Promise<Account> {
    try {
      if (!this.transport) {
        this.transport = await TransportWebUSB.create();
        this.filecoinApp = new FilecoinApp(this.transport);
      }

      const version = await this.filecoinApp.getVersion();
      if (version.device_locked) {
        throw new Error("Ledger is locked. Please unlock your Ledger device.");
      }
      if (version.test_mode) {
        throw new Error("Filecoin app is in test mode.");
      }
      if (version.major < 2) {
        throw new Error("Please update the Filecoin app on your Ledger device.");
      }

      const path = `m/44'/461'/0'/0/${this.accountIndex}`;
      const { addrString: address } = await this.filecoinApp.getAddressAndPubKey(path);

      const role = await fetchRole(address);
      this.account = {
        index: this.accountIndex,
        address,
        isConnected: true,
        wallet: new LedgerWallet(this.filecoinApp, address),
        role,
      };
      this.connected = true;
      return this.account;
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }
    this.connected = false;
    this.account = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Additional methods specific to Ledger
  async fetchAccounts(): Promise<LedgerAccount[]> {
    if (!this.transport) {
      this.transport = await TransportWebUSB.create();
      this.filecoinApp = new FilecoinApp(this.transport);
    }

    const accounts: LedgerAccount[] = [];
    for (let i = 0; i < 10; i++) {
      const path = `m/44'/461'/0'/0/${i}`;
      const { addrString } = await this.filecoinApp.getAddressAndPubKey(path);
      accounts.push({ address: addrString, index: i, path });
    }
    return accounts;
  }
}

interface LedgerAccount {
  address: string;
  path: string;
  index: number;
}
