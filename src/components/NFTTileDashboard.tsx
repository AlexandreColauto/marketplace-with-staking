import React from "react";
import type { metadata } from "../hooks/useLoadNFTs";

interface props {
  nft: metadata;
  listing: (nft: metadata) => void;
  staking: (nft: metadata) => void;
}

function NFTTile(props: props) {
  const { nft, listing, staking } = props;
  return (
    <div>
      <div className="border shadow rounded-xl overflow-hidden">
        <img className="object-cover w-60 h-60 rounded-t " src={nft.image} />
        <div className="flex flex-col justify-between">
          <div className="p-4">
            <p className="text-3x1 text-[#E8C39C]  font-semibold">{nft.name}</p>
            <div>
              <p className="text-gray-400">
                {nft.description ? nft.description : <br />}
              </p>
            </div>
            <br />
            {nft.price && <p>Price: {nft.price} BNB </p>}
            {nft.fee && <p>Fee: {nft.fee / 10} % </p>}
          </div>
          <div className="p-4 bg-transparent">
            <button
              className="w-full bg-secondary hover:bg-primary text-white hover:text-white cursor-pointer font-bold py-3 px-12 rounded-xl"
              onClick={() => {
                listing(nft);
              }}
            >
              Listing
            </button>
            <button
              className="w-full bg-secondary hover:bg-primary text-white hover:text-white cursor-pointer font-bold py-3 px-12 rounded-xl"
              onClick={() => {
                staking(nft);
              }}
            >
              Staking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NFTTile;
