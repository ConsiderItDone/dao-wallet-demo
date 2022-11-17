/// <reference types="react-scripts" />

import { InjectedWallet } from './types/injectedWallet.types';

declare global {
  interface Window {
    near: {
      omniWallet: InjectedWallet;
    };
  }
}
