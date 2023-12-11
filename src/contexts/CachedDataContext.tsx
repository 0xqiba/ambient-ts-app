import React, { createContext } from 'react';
import {
    FetchAddrFn,
    memoizeFetchEnsAddress,
    FetchContractDetailsFn,
    memoizeFetchContractDetails,
    TokenBalancesQueryFn,
    memoizeFetchTokenBalances,
    TokenPriceFn,
    memoizeTokenPrice,
    FetchBlockTimeFn,
    memoizeFetchBlockTime,
} from '../ambient-utils/api';

import {
    PoolStatsFn,
    memoizePoolStats,
    SpotPriceFn,
    memoizeQuerySpotPrice,
    memoizeGet24hChange,
    Change24Fn,
} from '../ambient-utils/dataLayer';

interface CachedDataIF {
    cachedFetchTokenBalances: TokenBalancesQueryFn;
    cachedFetchTokenPrice: TokenPriceFn;
    cachedPoolStatsFetch: PoolStatsFn;
    cachedGet24hChange: Change24Fn;
    cachedQuerySpotPrice: SpotPriceFn;
    cachedTokenDetails: FetchContractDetailsFn;
    cachedEnsResolve: FetchAddrFn;
    cachedFetchBlockTime: FetchBlockTimeFn;
}

export const CachedDataContext = createContext<CachedDataIF>(
    {} as CachedDataIF,
);

// TODO: refactor to cache in context and use other contexts as dependencies
export const CachedDataContextProvider = (props: {
    children: React.ReactNode;
}) => {
    const cachedDataState = {
        cachedFetchTokenBalances: memoizeFetchTokenBalances(),
        cachedFetchTokenPrice: memoizeTokenPrice(),
        cachedPoolStatsFetch: memoizePoolStats(),
        cachedGet24hChange: memoizeGet24hChange(),
        cachedQuerySpotPrice: memoizeQuerySpotPrice(),
        cachedTokenDetails: memoizeFetchContractDetails(),
        cachedEnsResolve: memoizeFetchEnsAddress(),
        cachedFetchBlockTime: memoizeFetchBlockTime(),
    };

    return (
        <CachedDataContext.Provider value={cachedDataState}>
            {props.children}
        </CachedDataContext.Provider>
    );
};
