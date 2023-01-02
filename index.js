const ethers = require("ethers");

const { RESOURCES } = require("./constants");

const MuticallABI = require("./abi/muticall.json");
const RouterABI = require("./abi/router.json");

async function main() {
  const provider = ethers.getDefaultProvider(RESOURCES.rpc.moonbeam);
  const multicall = new ethers.Contract(
    RESOURCES.multicall,
    MuticallABI,
    provider
  );

  const Stellaswap = new ethers.Contract(
    RESOURCES.dex.stella,
    RouterABI,
    provider
  );

  const Beamswap = new ethers.Contract(RESOURCES.dex.beam, RouterABI, provider);

  const pathStella = [RESOURCES.tokens.glmr, RESOURCES.tokens.usdcWorm];
  const pathBeam = [RESOURCES.tokens.glmr, RESOURCES.tokens.usdcMulti];

  const multicallBatchData = [
    {
      target: Stellaswap.address,
      callData: Stellaswap.interface.encodeFunctionData("getAmountsOut", [
        ethers.BigNumber.from(10).pow(18),
        pathStella,
      ]),
    },
    {
      target: Beamswap.address,
      callData: Beamswap.interface.encodeFunctionData("getAmountsOut", [
        ethers.BigNumber.from(10).pow(18),
        pathBeam,
      ]),
    },
  ];

  const multicallResult = await multicall.callStatic.tryAggregate(
    false,
    multicallBatchData
  );

  const decoded = [];
  multicallResult.map((r) => {
    decoded.push(
      Stellaswap.interface.decodeFunctionResult("getAmountsOut", r.returnData)
    );
  });

  console.log(`GLMR/USDC on Stellaswap: ${decoded[0].amounts[1].toString()}`);
  console.log(`GLMR/USDC on Beamswap: ${decoded[1].amounts[1].toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
