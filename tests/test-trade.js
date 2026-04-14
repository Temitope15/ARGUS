import tradeExecutor from '../backend/src/engine/tradeExecutor.js';

async function run() {
  console.log("Testing FULL_EXIT...");
  const exitRes = await tradeExecutor.executeProtection(
    { id: 'curve-3pool-eth', chain: 'eth', tokenId: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490-eth' }, 
    'FULL_EXIT',
    '0xTestWallet000000000000'
  );
  console.dir(exitRes, { depth: null });

  console.log("\nTesting WITHDRAW...");
  const drawRes = await tradeExecutor.executeProtection(
    { id: 'curve-3pool-eth', chain: 'eth', pairId: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7-eth' }, 
    'WITHDRAW',
    '0xTestWallet000000000000'
  );
  console.dir(drawRes, { depth: null });
}

run();
