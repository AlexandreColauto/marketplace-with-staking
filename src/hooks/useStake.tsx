import { useMoralis } from "react-moralis";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import NFTMarket from "../../artifacts/contracts/NFTMarket.sol/NFTMarket.json";
type props = {
  marketId?: number;
  price?: string;
  callback: () => void;
  errCallback: () => void;
};

const BuyNFT = () => {
  const { Moralis, isWeb3Enabled } = useMoralis();
  
  const buy = async (props: props) => {
    !isWeb3Enabled ? await Moralis.enableWeb3() : null;
    const marketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS;
    const userAddress = await Moralis.account;
    if (!marketAddress || !userAddress || !props.price) return;

    const { marketId, price, callback, errCallback } = props;
    try {
      const listItem = {
        contractAddress: marketAddress,
        functionName: "performATransaction",
        abi: NFTMarket.abi,
        params: {
          itemId: marketId,
        },
        msgValue: Moralis.Units.ETH(price),
      };
      const listTransaction: any = await Moralis.executeFunction(listItem);
      await listTransaction.wait();

      callback();
    } catch (err) {
      console.log(err);
      errCallback();
    }
  };

  return buy;
};

export default BuyNFT;
