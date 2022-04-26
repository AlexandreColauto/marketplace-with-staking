import React, { useEffect, useMemo, useState } from "react";
import useLoadNFTs from "../src/hooks/useLoadNFTs";
import ModalListNFT from "../src/components/ModalListNFT";
import ModalStakeNFT from "../src/components/ModalStakeNFT";
import type { metadata } from "../src/hooks/useLoadNFTs";
import Link from "next/link";
import { useMoralis } from "react-moralis";
import Moralis from "moralis";
import Disclosure from "../src/components/Disclosure";
import NFTTileDashboard from "../src/components/NFTTileDashboard";
import { useQuery } from "react-query";
import ToastError from "../src/components/ToastError";
import ToastSucess from "../src/components/ToastSucess";

function CreatorsDashboard() {
  const { isWeb3Enabled, user } = useMoralis();
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
  const fetchNFTs = useLoadNFTs();
  const { isLoading } = useQuery("collection", {
    enabled: isWeb3Enabled,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    executeFectchNFTs();
  }, [isWeb3Enabled, isLoading]);

  const executeFectchNFTs = async () => {
    if (!isWeb3Enabled && !isLoading) return;
    try {
      const [_metadata, _collectionList, loading] = await fetchNFTs();
      setEmpty(!_metadata?.length);
      setUserNFTsMetada(_metadata);
      setFilteredNFTs(_metadata);
      if (!_collectionList) return;
      setCollectionList(_collectionList);
      setAllCollections(true);
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

  const listNFT = async (nft: metadata) => {
    setnftToList(nft);
    toggleListModal();
    return;
  };
  const stakeNFT = async (nft: metadata) => {
    setnftToList(nft);
    toggleStakeModal();
    return;
  };

  const toggleListModal = () => {
    setModalListOpen(!modalListOpen);
  };
  const toggleStakeModal = () => {
    setModalStakeOpen(!modalStakeOpen);
  };

  async function picklistChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const collectionName = e.target.value;
    if (collectionName === "All Collections") {
      setFilteredNFTs(userNFTsMetada);
      setAllCollections(true);
      return;
    }
    if (!userNFTsMetada) return;
    const _metadata = userNFTsMetada.filter((item) => {
      console.log(item);
      return item.address === collectionName.toLowerCase();
    });
    setAllCollections(false);
    setFilteredNFTs(_metadata);
  }

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
          {nftToList && (
            <div>
              <ModalListNFT
                isOpen={modalListOpen}
                toggle={toggleListModal}
                NFTToList={nftToList}
                setErrorMessage={setisError}
                setSuccessMessage={setIsSuccess}
              />
              <ModalStakeNFT
                isOpen={modalStakeOpen}
                toggle={toggleStakeModal}
                NFTToList={nftToList}
                setErrorMessage={setisError}
                setSuccessMessage={setIsSuccess}
              />
            </div>
          )}
          <p className="text-5xl text-[#E8C39C] font-bold text-center py-14">
            Your Collection
          </p>
          <div className="flex mt-4 bg-black w-4/12 mb-8 mx-auto border border-secondary rounded overflow-hidden">
            <span className="text-sm text-white  px-4 py-2 bg-secondary whitespace-no-wrap">
              Collection:
            </span>
            <select
              className=" py-2 w-full  bg-white"
              onChange={(e) => {
                picklistChange(e);
              }}
            >
              <option>All Collections</option>
              {collectionList.map((collection, i) => (
                <option key={i} value={collection.get("collectionAddress")}>
                  {collection.get("name")}
                </option>
              ))}
            </select>
          </div>
          {!allCollections ? (
            <div className="md:flex justify-center">
              <div className="px-4" style={{ maxWidth: "1600px" }}>
                {filteredNFTs && filteredNFTs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    {filteredNFTs.map((nft: any, i: any) => (
                      <div key={i}>
                        <NFTTileDashboard
                          nft={nft}
                          listing={listNFT}
                          staking={stakeNFT}
                        />
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
          ) : (
            <div>
              {userNFTsMetada &&
                collectionList.map(
                  (collection, i) =>
                    userNFTsMetada.filter((item) => {
                      return (
                        item.address ===
                        collection.get("collectionAddress").toLowerCase()
                      );
                    }).length > 0 && (
                      <Disclosure
                        key={i}
                        collectionName={collection.get("name")}
                        filteredNFTs={userNFTsMetada.filter((item) => {
                          return (
                            item.address ===
                            collection.get("collectionAddress").toLowerCase()
                          );
                        })}
                        listNFT={listNFT}
                        stakeNFT={stakeNFT}
                      />
                    )
                )}
            </div>
          )}
        </div>
      )}

      {isSuccess && <ToastSucess isOpen={true} toggle={setIsSuccess} />}
      {isError && <ToastError isOpen={true} toggle={setisError} />}
    </div>
  );
}

export default CreatorsDashboard;
