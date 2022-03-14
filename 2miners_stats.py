import requests, datetime, statistics

import requests.packages.urllib3.util.connection
from socket import AF_INET

requests.packages.urllib3.util.connection.allowed_gai_family = lambda: AF_INET

GH = 1000000000
H_TO_GH = lambda x: int(x / GH)

MH = 1000000
H_TO_MH = lambda x: int(x / MH)

call         = requests.get("https://eth.2miners.com/api/miners")
stats_miners = call.json()

call         = requests.get("https://eth.2miners.com/api/stats")
stats_pool   = call.json()

hashrateEthereum = int(stats_pool["nodes"][0]["networkhashps"])

miners = stats_miners["miners"]

nano_miners              = {k: v for k, v in miners.items() if( (k.startswith("nano_") or k.startswith("xrb_")) and not v["offline"] )}
hashrate_nano_list       = [info["hr"] for info in nano_miners.values()]
hashrate_nano_total      = sum(hashrate_nano_list)

ethereum_miners         = {k: v for k, v in miners.items() if( k.startswith("0x") and not v["offline"] )}
hashrate_ethereum_list  = [info["hr"] for info in ethereum_miners.values()]
hashrate_ethereum_total = sum(hashrate_ethereum_list)

bitcoin_miners          = {k: v for k, v in miners.items() if( (k.startswith("1") or k.startswith("3") or k.startswith("bc1")) and not v["offline"] )}
hashrate_bitcoin_list   = [info["hr"] for info in bitcoin_miners.values()]
hashrate_bitcoin_total  = sum(hashrate_bitcoin_list)

print(f"Date: {datetime.datetime.fromtimestamp(stats_miners['now'] / 1000).strftime('%Y-%m-%d %H:%M')}")

print()
print(f"Miners: {stats_miners['minersTotal']}")
print(f"2miners % of network hashrate: {stats_miners['hashrate'] * 100 / hashrateEthereum:.2f}%")

print()
print("XNO:")
print(f"    Miners: {len(nano_miners)}")
print(f"    % of pool miners: {len(nano_miners) * 100 / stats_miners['minersTotal']:.2f}%")
print(f"    % of pool hashrate: {hashrate_nano_total * 100 / stats_miners['hashrate']:.2f}%")
print(f"    GH/s: {H_TO_GH(hashrate_nano_total)}")
print(f"    >= 1 GH/s: {len([hr for hr in hashrate_nano_list if( H_TO_GH(hr) >= 1 )])}")
print(f"    < 1 GH/s: {len([hr for hr in hashrate_nano_list if( H_TO_GH(hr) < 1 )])}")
print(f"    Average MH/s: {H_TO_MH(statistics.mean(hashrate_nano_list))}")
print(f"    Median MH/s: {H_TO_MH(statistics.median(hashrate_nano_list))}")

print()
print("BTC:")
print(f"    Miners: {len(bitcoin_miners)}")
print(f"    % of pool miners: {len(bitcoin_miners) * 100 / stats_miners['minersTotal']:.2f}%")
print(f"    % of pool hashrate: {hashrate_bitcoin_total * 100 / stats_miners['hashrate']:.2f}%")
print(f"    GH/s: {H_TO_GH(hashrate_bitcoin_total)}")
print(f"    >= 1 GH/s: {len([hr for hr in hashrate_bitcoin_list if( H_TO_GH(hr) >= 1 )])}")
print(f"    < 1 GH/s: {len([hr for hr in hashrate_bitcoin_list if( H_TO_GH(hr) < 1 )])}")
print(f"    Average MH/s: {H_TO_MH(statistics.mean(hashrate_bitcoin_list))}")
print(f"    Median MH/s: {H_TO_MH(statistics.median(hashrate_bitcoin_list))}")

print()
print("ETH:")
print(f"    Miners: {len(ethereum_miners)}")
print(f"    % of pool miners: {len(ethereum_miners) * 100 / stats_miners['minersTotal']:.2f}%")
print(f"    % of pool hashrate: {hashrate_ethereum_total * 100 / stats_miners['hashrate']:.2f}%")
print(f"    GH/s: {H_TO_GH(hashrate_ethereum_total)}")
print(f"    >= 1 GH/s: {len([hr for hr in hashrate_ethereum_list if( H_TO_GH(hr) >= 1 )])}")
print(f"    < 1 GH/s: {len([hr for hr in hashrate_ethereum_list if( H_TO_GH(hr) < 1 )])}")
print(f"    Average MH/s: {H_TO_MH(statistics.mean(hashrate_ethereum_list))}")
print(f"    Median MH/s: {H_TO_MH(statistics.median(hashrate_ethereum_list))}")