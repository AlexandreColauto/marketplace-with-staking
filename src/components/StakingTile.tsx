import React, { useState } from "react";
import type { metadata } from "../hooks/useFetchStake";

interface props {
  nft: metadata;
  claimStake: (nft: metadata) => void;
}

function NFTTile(props: props) {
  const { nft, claimStake } = props;
  return (
    <div>
      <div className="border shadow rounded-xl overflow-hidden">
        <img className="object-cover w-60 h-60 rounded-t " src={nft.image} />
        <div className="flex flex-col justify-between">
          <div className="p-4">
            <p className="text-3x1 text-[#E8C39C]  font-semibold">{nft.name}</p>
            <div>
              <p className="text-gray-400"></p>
            </div>
            <br />
            {nft.reward && <p>Current reward: {nft.reward} BNB </p>}
            {nft.startedDate && (
              <p>Started Date: {nft.startedDate.toLocaleDateString()} </p>
            )}
          </div>
          <div className="p-4 bg-transparent">
            <button
              className="w-full bg-secondary hover:bg-primary text-white hover:text-white cursor-pointer font-bold py-3 px-12 rounded-xl"
              onClick={() => {
                claimStake(nft);
              }}
            >
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NFTTile;
