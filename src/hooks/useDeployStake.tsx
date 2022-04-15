import { useMoralis } from "react-moralis";
import StakingRewards from "../../artifacts/contracts/StakingRewards.sol/StakingRewards.json";

type create = () => Promise<string>;
function useCreateCollection(): [create] {
  const { isAuthenticated, Moralis } = useMoralis();

  const create: create = async () => {
    const ethers = Moralis.web3Library;

    try {
      const web3Provider = await Moralis.enableWeb3();
      const signer = await web3Provider.getSigner();

      const tokenContract = new ethers.ContractFactory(
        StakingRewards.abi,
        StakingRewards.bytecode,
        signer
      );
      const nft = await tokenContract.deploy(Moralis.Units.ETH("2"));
      await nft.deployed();
      console.log("nft deployed to:", nft.address);

      return nft.address;
    } catch (error: any) {
      console.log(error);
      return "";
    }
  };

  return [create];
}
export default useCreateCollection;
