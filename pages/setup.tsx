import React, { useState } from "react";
import useDeployMaket from "../src/hooks/useDeployMaket";
import useDeployStake from "../src/hooks/useDeployStake";

function Setup() {
  const [address, setAddress] = useState("");
  const [stakeAddress, setStakeAddress] = useState("");
  const [create] = useDeployMaket();
  const [createStake] = useDeployStake();

  const handleClick = async () => {
    const _address = await create();
    setAddress(_address);
    // const stakeAddress = await createStake();
    // setStakeAddress(stakeAddress);
  };

  return (
    <div className="flex justify-center my-24">
      <div className="text-xl font-bold text-white">
        <p>
          In order to make the deploy of the website you need to go through some
          steps,
        </p>
        <br />
        <p>first deploy the market and grab the address:</p>
        <button onClick={handleClick} className="border p-2 my-4">
          Deploy the market
        </button>
        <div>Market Address: {address}</div>
        <div>Stake Address: {stakeAddress}</div>
        <br />
        <br />
        <p>Then edit the .env.example file with the propper information </p>
        <p> (contract address and credentials from the services),</p>
        <p>and rename the file to just .env </p>
        <br />
        <p>This will set your environment variables.</p>
        <p>If all the information was set correctly, the webiste is ready!</p>
      </div>
    </div>
  );
}

export default Setup;
