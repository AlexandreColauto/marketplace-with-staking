import { useMoralis } from "react-moralis";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import StakingRewards from "../../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
type props = {
  collectionAddr: string;
  id: string;
  callback: () => void;
  errCallback: () => void;
};

const StakeNFT = () => {
  const { Moralis, isWeb3Enabled } = useMoralis();
  const stake = async (props: props) => {
    !isWeb3Enabled ? await Moralis.enableWeb3() : null;
    const stakeAddress = process.env.NEXT_PUBLIC_NFT_STAKE_ADDRESS;
    const userAddress = await Moralis.account;
    if (!stakeAddress || !userAddress) return;

    const { collectionAddr, id, callback, errCallback } = props;
    try {
      const isApprvd = {
        contractAddress: collectionAddr,
        functionName: "isApprovedForAll",
        abi: NFT.abi,
        params: {
          account: userAddress,
          operator: stakeAddress,
        },
      };

      const isApproved = await Moralis.executeFunction(isApprvd);
      if (!isApproved) {
        const setApproval = {
          contractAddress: collectionAddr,
          functionName: "setApprovalForAll",
          abi: NFT.abi,
          params: {
            operator: stakeAddress,
            approved: true,
          },
        };
        const approveTransaction: any = await Moralis.executeFunction(
          setApproval
        );
        await approveTransaction.wait();
      }

      const createStakeParams = {
        contractAddress: stakeAddress,
        functionName: "createStake",
        abi: StakingRewards.abi,
        params: {
          nftAddress: collectionAddr,
          nftId: id,
        },
      };
      console.log(id);
      const listTransaction: any = await Moralis.executeFunction(
        createStakeParams
      );
      await listTransaction.wait();

      callback();
    } catch (err) {
      console.log(err);
      errCallback();
    }
  };

  return stake;
};

export default StakeNFT;
