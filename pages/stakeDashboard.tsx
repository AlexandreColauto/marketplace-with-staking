import React, { useEffect, useMemo, useState } from "react";
import useFetchStake from "../src/hooks/useFetchStake";
import useClaimStake from "../src/hooks/useClaimStake";
import type { metadata } from "../src/hooks/useFetchStake";
import Link from "next/link";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import Disclosure from "../src/components/Disclosure";
import StakingTile from "../src/components/StakingTile";
import { useQuery } from "react-query";
import ToastError from "../src/components/ToastError";
import ToastSucess from "../src/components/ToastSucess";
import Processing from "../src/components/Processing";

function CreatorsDashboard() {
  const { isWeb3Enabled, user } = useMoralis();
  const [processing, setProcessing] = useState(false);
  const [nftToList, setnftToList] = useState<metadata>();
  const [modalListOpen, setModalListOpen] = useState(false);
  const [modalStakeOpen, setModalStakeOpen] = useState(false);
  const [userNFTsMetada, setUserNFTsMetada] = useState<metadata[]>();
  const [filteredNFTs, setFilteredNFTs] = useState<metadata[]>();
  const [allCollections, setAllCollections] = useState<boolean>();
  const [empty, setEmpty] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setisError] = useState(false);
  const [collectionList, setCollectionList] = useState<
    Moralis.Object<Moralis.Attributes>[]
  >([]);
  const fetchStakes = useFetchStake();
  const claimStake = useClaimStake();

  useEffect(() => {
    executeFectchNFTs();
  }, [isWeb3Enabled]);

  const executeFectchNFTs = async () => {
    if (!isWeb3Enabled) return;
    try {
      const stakes = await fetchStakes();
      console.log(stakes);
      setEmpty(!stakes?.length);
      setUserNFTsMetada(stakes);
      setFilteredNFTs(stakes);
      // if (!_collectionList) return;
      // setCollectionList(_collectionList);
      // setAllCollections(true);
    } catch (err) {
      console.log(err);
      if (!isError) {
        setisError(true);
        setTimeout(function () {
          setisError(false);
        }, 5000);
      }
    }
  };

  const executeclaimStake = async (nft: metadata) => {
    setProcessing(true);
    const callback = () => {
      if (!isSuccess) {
        setProcessing(false);
        setIsSuccess(true);
        setTimeout(function () {
          setIsSuccess(false);
        }, 5000);
      }
    };
    const errCallback = () => {
      setProcessing(false);
      if (!isError) {
        setisError(true);
        setTimeout(function () {
          setisError(false);
        }, 5000);
      }
    };
    const props = {
      stakeIndex: nft.stakeIndex,
      callback: callback,
      errCallback: errCallback,
    };
    console.log(props);
    claimStake(props);
    return;
  };

  return (
    <div className="pb-24">
      {empty ? (
        <div className="flex mx-auto justify-content-center mt-8">
          <div className="mx-auto text-center">
            <p className="text-4xl text-[#E8C39C] font-bold">
              {" "}
              You currently have no NFT, you can mint another one.
            </p>
            <br />
            <Link href="/create">
              <button className="w-4/12 bg-secondary hover:bg-primary text-white hover:text-white cursor-pointer font-bold py-3 px-12 rounded-xl">
                {" "}
                Mint{" "}
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-5xl text-[#E8C39C] font-bold text-center py-14">
            Your Collection
          </p>
          <div className="flex mt-4 bg-black w-4/12 mb-8 mx-auto border border-secondary rounded overflow-hidden"></div>
          <div className="md:flex justify-center">
            <div className="px-4" style={{ maxWidth: "1600px" }}>
              {filteredNFTs && filteredNFTs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  {filteredNFTs.map((nft: any, i: any) => (
                    <div key={i}>
                      <StakingTile nft={nft} claimStake={executeclaimStake} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex w-full mx-auto justify-content-center mt-8">
                  <div className="mx-auto text-center">
                    <p className="text-4xl font-bold">
                      <div>You Have No NFTs On This Colleciton</div>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Processing isOpen={processing} />

      {isSuccess && <ToastSucess isOpen={true} toggle={setIsSuccess} />}
      {isError && <ToastError isOpen={true} toggle={setisError} />}
    </div>
  );
}

export default CreatorsDashboard;
