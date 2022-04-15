import { useMoralis } from "react-moralis";
import axios from "axios";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";

type uploadFile = (e: File) => Promise<string>;
interface props {
  name: string;
  description?: string;
  imgUrl?: string | null;
  fee?: string | null;
  callback: () => void;
}
type create = (props: props) => Promise<boolean>;
function useCreateCollection(): [uploadFile, create] {
  const { isAuthenticated, Moralis } = useMoralis();
  const marketAddress = process.env.NEXT_PUBLIC_NFT_MARKET_ADDRESS;
  const stakingAddress = process.env.NEXT_PUBLIC_NFT_STAKE_ADDRESS;

  const create: create = async (props) => {
    const ethers = Moralis.web3Library;

    const { name, description, imgUrl, fee, callback } = props;

    if (!name) {
      alert("Give a name to your collection!");
      return false;
    }
    try {
      const contentType = "application/json"; // type of file
      // setup params for putObject
      const key = name + "/";
      const payload = {
        key,
        contentType,
      };

      const resp = await axios.post("/api/upload", payload);
      const response = await axios.get("/api/aws");

      if (response.status !== 200) return false;
      const [s3Bucket, region] = response.data;
      console.log(response.data);
      const web3Provider = await Moralis.enableWeb3();
      const signer = await web3Provider.getSigner();
      const address = await Moralis.account;
      const url =
        "https://" +
        s3Bucket +
        ".s3." +
        region +
        ".amazonaws.com/" +
        name.replace(" ", "+") +
        "/";
      console.log(url);
      const tokenContract = new ethers.ContractFactory(
        NFT.abi,
        NFT.bytecode,
        signer
      );
      const nft = await tokenContract.deploy(
        url + "{id}.json",
        marketAddress,
        stakingAddress,
        fee,
        address
      );
      await nft.deployed();
      console.log("nft deployed to:", nft.address);

      const Collection = Moralis.Object.extend({
        className: "collection",
      });
      const collection = new Collection();
      collection.save({
        name: name,
        collectionAddress: nft.address,
        s3: url,
        owner: address,
        imgUrl: imgUrl,
        description: description,
      });

      callback();
      return true;
    } catch (error: any) {
      console.log(error);
      return false;
    }
  };

  const saveFile: uploadFile = async (e) => {
    const data = e;
    const file = new Moralis.File(data.name, data);
    await file.saveIPFS();
    return file._url;
  };

  return [saveFile, create];
}
export default useCreateCollection;
