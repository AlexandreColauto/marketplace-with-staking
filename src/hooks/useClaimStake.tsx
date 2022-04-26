import { useMoralis } from "react-moralis";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import StakingRewards from "../../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
type props = {
  stakeIndex: string;
  callback: () => void;
  errCallback: () => void;
};

const ClaimStake = () => {
  const { Moralis, isWeb3Enabled } = useMoralis();
  const claim = async (props: props) => {
    !isWeb3Enabled ? await Moralis.enableWeb3() : null;
    const stakeAddress = process.env.NEXT_PUBLIC_NFT_STAKE_ADDRESS;
    const userAddress = await Moralis.account;
    if (!stakeAddress || !userAddress) return;

    const { stakeIndex, callback, errCallback } = props;
    try {
      const claimStake = {
        contractAddress: stakeAddress,
        functionName: "claimStake",
        abi: StakingRewards.abi,
        params: {
          stakeIndex: stakeIndex,
        },
      };
      console.log(stakeIndex);
      const listTransaction: any = await Moralis.executeFunction(claimStake);
      await listTransaction.wait();

      callback();
    } catch (err) {
      console.log(err);
      errCallback();
    }
  };

  return claim;
};

export default ClaimStake;
