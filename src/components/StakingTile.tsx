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
      <div className="border-4 border-[#E8C39C] bg-white shadow rounded-xl overflow-hidden">
        <img
          className="object-cover mx-auto w-60 h-60 rounded-t "
          src={nft.image}
        />
        <div className="flex flex-col justify-between">
          <div className="p-4">
            <p className="text-4xl mx-2 text-[#E8C39C]  font-semibold">{nft.name}</p>
            <div>
              <p className="text-gray-300"></p>
            </div>
            <br />
            <div className="text-base mx-2">
              {nft.reward && <p><span className="font-bold text-primary">Current reward: </span>{nft.reward} BNB </p>}
              <br />
              {nft.startedDate && (
                <p><span className="font-bold text-primary">Started Date: </span> {nft.startedDate.toLocaleDateString()} </p>
              )}
            </div>
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
