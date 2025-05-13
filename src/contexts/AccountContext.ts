import { createContext } from "react";

import { Account } from "@/types/account";
import { Connector } from "@/types/connector";

interface AccountContextType {
  account: Account | null;
  connectors: { [key: string]: Connector };
  connect: (connectorName: string, accountIndex?: number) => Promise<void>;
  disconnect: () => Promise<void>;
  loadPersistedAccount: () => Promise<void>;

  // Root Key Holder
  proposeAddVerifier: (verifierAddress: string, datacap: number) => Promise<string>;
  acceptVerifierProposal: (verifierAddress: string, datacap: number, fromAccount: string, transactionId: number) => Promise<string>;
}

export const AccountContext = createContext<AccountContextType | undefined>(undefined);
