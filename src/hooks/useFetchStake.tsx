import { useMoralis } from "react-moralis";
import StakingRewards from "../../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import axios from "axios";

interface Stake {
  stakeId: number;
  amount: number;
  stakeOwner: string;
  createdDate: number;
  active: boolean;
  nftAddress: string;
  nftId: number;
  reward?: string;
}

interface metadata {
  name: string;
  id: string;
  image: string;
  stakeIndex: string;
  startedDate?: Date;
  reward?: string;
}

type fetchItems = (
  collectionAddress?: string | undefined
) => Promise<metadata[] | undefined>;

interface dictionary {
  [key: string]: string;
}

const useFetchStake = (): fetchItems => {
  const { Moralis, isWeb3Enabled, isWeb3EnableLoading, web3 } = useMoralis();
  const stakeAddress = process.env.NEXT_PUBLIC_NFT_STAKE_ADDRESS;

  const fetchItems = async (): Promise<metadata[] | undefined> => {
    if (!isWeb3Enabled) return;
    const userAddress = await Moralis.account;
    if (!stakeAddress || !userAddress) return;

    const fetchStakes = {
      contractAddress: stakeAddress,
      functionName: "retrieveUserStakes",
      abi: StakingRewards.abi,
      params: {
        user: userAddress,
      },
    };
    try {
      const userStakes: any = await Moralis.executeFunction(fetchStakes);
      const activeStakes = filterActiveStakes(userStakes);
      const stakeMeta = await estReward(activeStakes);
      const collectionsURI = await getCollectionURI(stakeMeta);
      const _stakeMeta = await setStakeMetadata(stakeMeta, collectionsURI);
      return _stakeMeta;
    } catch (err) {
      console.log(err);
      return;
    }
  };
  const filterActiveStakes = (userStakes: Stake[]) => {
    return userStakes.filter((stake) => {
      return stake.active;
    });
  };

  async function estReward(userStakes: Stake[]) {
    return await Promise.all(
      userStakes.map(async (stake) => {
        const _stake: Stake = { ...stake };
        try {
          const userAddress = Moralis.account;
          if (!stakeAddress || !userAddress) return _stake;
          const estReward = {
            contractAddress: stakeAddress,
            functionName: "estimateReward",
            abi: StakingRewards.abi,
            params: {
              stakeIndex: stake.stakeId,
            },
          };
          const stakeReward: any = await Moralis.executeFunction(estReward);
          _stake.reward = Moralis.Units.FromWei(stakeReward);
          console.log(_stake);
          return _stake;
        } catch (err: any) {
          console.log(err);
          return _stake;
        }
      })
    );
  }
  const getCollectionURI = async (stakeItems: Stake[]) => {
    const CollectionURIDictionary: dictionary = {};
    await Promise.all(
      stakeItems.map(async (item) => {
        if (!CollectionURIDictionary[item.nftAddress]) {
          const ethers = Moralis.web3Library;
          if (!web3) return;
          const nftContract = new ethers.Contract(
            item.nftAddress,
            NFT.abi,
            web3
          );
          const uri = await nftContract.uri(item.nftId);
          CollectionURIDictionary[item.nftAddress] = uri;
        }
      })
    );
    return CollectionURIDictionary;
  };
  async function setStakeMetadata(
    stakeMetadata: Stake[],
    collectionsURI: dictionary
  ) {
    return await Promise.all(
      stakeMetadata.map(async (stake) => {
        const nftURI = collectionsURI[stake.nftAddress];
        const tokenIdString = stake.nftId.toString().padStart(64, "0");
        const uri = nftURI?.replace("{id}", tokenIdString);
        const _metadata = await axios.get(uri);
        const metadata: metadata = _metadata.data;
        metadata.reward = stake.reward;
        metadata.startedDate = new Date(stake.createdDate * 1000);
        metadata.stakeIndex = stake.stakeId.toString();
        return metadata;
      })
    );
  }

  return fetchItems;
};

export type { Stake, metadata };

export default useFetchStake;
