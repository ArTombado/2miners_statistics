var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]

if (!String.prototype.startsWith)
{
  Object.defineProperty(String.prototype, 'startsWith', {value: function(search, rawPos)
  {
    var pos = rawPos > 0 ? rawPos|0 : 0;
    return this.substring(pos, pos + search.length) === search;
  }})
}

var template = [
  ["XNO"],
  ["BTC"],
  ["ETH"]
]

var columns = [
  [
  "Date",
  "Total miners",
  "2miners % of network hashrate",
  "Coin",
  "Miners",
  "% of pool miners",
  "% of pool hashrate",
  "GH/s",
  ">= 1 GH/s",
  "< 1 GH/s",
  "Average MH/s",
  "Median MH/s"
  ]
]

function H_TO_GH(x)
{
  return parseInt(x / 1000000000)
}

function H_TO_MH(x)
{
  return parseInt(x / 1000000)
}

function deleteTriggers()
{
  var triggers = ScriptApp.getProjectTriggers()
  var hasMainTrigger = false

  for (var i = 0; i < triggers.length; i++) {
    if ( triggers[i].getHandlerFunction() == "main" ) {
      ScriptApp.deleteTrigger(triggers[i])
      hasMainTrigger = true
    }
  }

  return hasMainTrigger
}

function main()
{
  var HOUR = 12
  
  var date = new Date()

  var date_string = Utilities.formatDate(date, "UTC", "yyyy-MM-dd HH:mm")

  date.setUTCDate(date.getDate() + 1)
  date.setUTCHours(HOUR, 0, 0, 0)
  
  if( deleteTriggers() )
  {
    twominers_statistics(date_string)
  }

  ScriptApp.newTrigger("main")
  .timeBased()
  .at(date)
  .inTimezone("UTC")
  .create()
}

function twominers_statistics(date_string)
{

  var init = make_template()
  
  var stats_miners = JSON.parse(UrlFetchApp.fetch("https://eth.2miners.com/api/miners").getContentText())
  var stats_pool   = JSON.parse(UrlFetchApp.fetch("https://eth.2miners.com/api/stats").getContentText())

  var hashrateEthereum = parseInt(stats_pool.nodes[0].networkhashps)

  var miners = stats_miners.miners

  var nano_miners             = {}
  var hashrate_nano_list      = []
  var hashrate_nano_total     = 0

  var bitcoin_miners          = {}
  var hashrate_bitcoin_list   = []
  var hashrate_bitcoin_total  = 0

  var ethereum_miners         = {}
  var hashrate_ethereum_list  = []
  var hashrate_ethereum_total = 0
 
  for( var miner in miners )
  {
    if( !miners[miner].offline || miners[miner].hr != 0 )
    {
      if( miner.startsWith("nano_") || miner.startsWith("xrb_") )
      {
        nano_miners[miner] = miners[miner]
        hashrate_nano_list.push(nano_miners[miner].hr)
        hashrate_nano_total += nano_miners[miner].hr
      }
      else if( miner.startsWith("0x") )
      {
        ethereum_miners[miner] = miners[miner]
        hashrate_ethereum_list.push(ethereum_miners[miner].hr)
        hashrate_ethereum_total += ethereum_miners[miner].hr
      }
      else if( miner.startsWith("1") || miner.startsWith("3") || miner.startsWith("bc1") )
      {
        bitcoin_miners[miner] = miners[miner]
        hashrate_bitcoin_list.push(bitcoin_miners[miner].hr)
        hashrate_bitcoin_total += bitcoin_miners[miner].hr
      }
    }
  }

  var minersTotal = hashrate_bitcoin_list.length + hashrate_nano_list.length + hashrate_ethereum_list.length
  var hashrateTotal = hashrate_bitcoin_total + hashrate_nano_total + hashrate_ethereum_total

  var fill_template_merged = [[]]
  
  fill_template_merged[0].push(date_string)

  fill_template_merged[0].push(minersTotal)
  fill_template_merged[0].push((hashrateTotal * 100 / hashrateEthereum).toFixed(2) + "%")

  sheet.getRange(init, 1, 1, 3).setValues(fill_template_merged)

  var fill_template = [[], [], []]

  //XNO row
  fill_template[0].push(Object.keys(nano_miners).length)
  fill_template[0].push((Object.keys(nano_miners).length * 100 / minersTotal).toFixed(2) + "%")
  fill_template[0].push((hashrate_nano_total * 100 / hashrateTotal).toFixed(2) + "%")
  fill_template[0].push(H_TO_GH(hashrate_nano_total))
  fill_template[0].push(hashrate_nano_list.filter(function(x) { if( H_TO_GH(x) >= 1 ){return x} }).length)
  fill_template[0].push(hashrate_nano_list.filter(function(x) { if( H_TO_GH(x) < 1 ){return x} }).length)
  fill_template[0].push(H_TO_MH(average(hashrate_nano_list)))
  fill_template[0].push(H_TO_MH(median(hashrate_nano_list)))

  //BTC row
  fill_template[1].push(Object.keys(bitcoin_miners).length)
  fill_template[1].push((Object.keys(bitcoin_miners).length * 100 / minersTotal).toFixed(2) + "%")
  fill_template[1].push((hashrate_bitcoin_total * 100 / hashrateTotal).toFixed(2) + "%")
  fill_template[1].push(H_TO_GH(hashrate_bitcoin_total))
  fill_template[1].push(hashrate_bitcoin_list.filter(function(x) { if( H_TO_GH(x) >= 1 ){return x} }).length)
  fill_template[1].push(hashrate_bitcoin_list.filter(function(x) { if( H_TO_GH(x) < 1 ){return x} }).length)
  fill_template[1].push(H_TO_MH(average(hashrate_bitcoin_list)))
  fill_template[1].push(H_TO_MH(median(hashrate_bitcoin_list)))

  //ETH row
  fill_template[2].push(Object.keys(ethereum_miners).length)
  fill_template[2].push((Object.keys(ethereum_miners).length * 100 / minersTotal).toFixed(2) + "%")
  fill_template[2].push((hashrate_ethereum_total * 100 / hashrateTotal).toFixed(2) + "%")
  fill_template[2].push(H_TO_GH(hashrate_ethereum_total))
  fill_template[2].push(hashrate_ethereum_list.filter(function(x) { if( H_TO_GH(x) >= 1 ){return x} }).length)
  fill_template[2].push(hashrate_ethereum_list.filter(function(x) { if( H_TO_GH(x) < 1 ){return x} }).length)
  fill_template[2].push(H_TO_MH(average(hashrate_ethereum_list)))
  fill_template[2].push(H_TO_MH(median(hashrate_ethereum_list)))

  sheet.getRange(init, 5, 3, 8).setValues(fill_template)
}

function make_template()
{
  var stats_columns = sheet.getRange(1, 1, 1, 12)

  sheet.setFrozenRows(0)

  if( stats_columns.getValues().toString() != columns.toString() )
  {
    if( sheet.getMaxRows() > 1 )
    {
      sheet.deleteRows(2, sheet.getMaxRows() - 1)
    }
    if( sheet.getMaxColumns() > 12 )
    {
      sheet.deleteColumns(13, sheet.getMaxColumns() - 12)
    }
    stats_columns.setValues(columns)
  }

  sheet.appendRow([null])
  sheet.setFrozenRows(1)

  var init = sheet.getLastRow() + 2

  sheet.getRange(init, 4, 3).setValues(template) //Put XNO, BTC and ETHEREUM in the cells.
  sheet.getRange(init, 1, 3, 3).mergeVertically() //Merge date, total miners and 2miners % of network hashrate cells.

  return init
}

function median(values){
  values.sort(function(a, b) { return a - b })

  var half = Math.floor(values.length / 2)
  
  if (values.length % 2)
  {
    return values[half]
  }
  
  return (values[half - 1] + values[half]) / 2
}

function average(array) {
    return array.reduce(function(a, b) { return a + b }) / array.length;
}
