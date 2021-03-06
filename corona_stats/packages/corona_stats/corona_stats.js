// jshint esversion: 9
const coronaMeter = 'https://www.worldometers.info/coronavirus/';
const covid19India = 'https://api.covid19india.org/';
const countryDomId = 'table_countries_today';
const axios = require('axios');
const cheerio = require('cheerio');
const tableParser = require('cheerio-tableparser');
let countryHtml;
let usStatesHtml;
let inStatesData;
let inDistrictData;

const mui = (element, client) => {
  if (client === 'mattermost') {
    const output = [];
    switch (element.type) {
      case 'context': {
        for (const item of element.elements) {
          output.push(item.text.replace(/\*/g, '**'));
        }
        break;
      }
      case 'section': {
        if (element.fields && element.fields.length > 0) {
          for (const field of element.fields) {
            output.push(field.text.replace(/\*/g, '**') + '\n');
          }
        } else if (element.text) {
          output.push('#### ' + element.text.text.replace(/\*/g, '**'));
        }
        break;
      }
      case 'mrkdwn': {
        output.push('#### ' + element.text.replace(/\*/g, '**'));
        break;
      }
      case 'image': {
        output.push(`![${element.alt_text}](${element.image_url})`);
        break;
      }
      case 'divider': {
        output.push('***');
        break;
      }
    }
    return output.join(' ');
  }
  return element;
};

const toTitleCase = phrase =>
  phrase
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getCountryName = name => {
  const longNames = {
    US: 'USA',
    USA: 'USA',
    ES: 'Spain',
    IT: 'Italy',
    FR: 'France',
    DE: 'Germany',
    UK: 'UK',
    CN: 'China',
    IR: 'Iran',
    TR: 'Turkey',
    BE: 'Belgium',
    NL: 'Netherlands',
    CH: 'Switzerland',
    CAN: 'Canada',
    BR: 'Brazil',
    RU: 'Russia',
    PT: 'Portugal',
    AT: 'Austria',
    IL: 'Israel',
    SK: 'S. Korea',
    SE: 'Sweden',
    IE: 'Ireland',
    IN: 'India',
    PE: 'Peru',
    EC: 'Ecuador',
    JP: 'Japan',
    CL: 'Chile',
    PL: 'Poland',
    NO: 'Norway',
    AU: 'Australia',
    RO: 'Romania',
    DK: 'Denmark',
    CZ: 'Czechia',
    PK: 'Pakistan',
    PH: 'Philippines',
    MY: 'Malaysia',
    MX: 'Mexico',
    SA: 'Saudi Arabia',
    ID: 'Indonesia',
    RS: 'Serbia',
    PA: 'Panama',
    LU: 'Luxembourg',
    UA: 'Ukraine',
    QA: 'Qatar',
    FI: 'Finland',
    DO: 'Dominican Republic',
    CO: 'Colombia',
    TH: 'Thailand',
    BY: 'Belarus',
    SG: 'Singapore',
    AR: 'Argentina',
    ZA: 'South Africa',
    GR: 'Greece',
    EG: 'Egypt',
    HK: 'Hong Kong',
    SL: 'Sri Lanka',
    IQ: 'Iraq',
    Default: name
  };
  return longNames[name] || toTitleCase(longNames.Default);
};

const getUSStateName = name => {
  const longNames = {
    AL: 'Alabama',
    AK: 'Alaska',
    AS: 'American Samoa',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District Of Columbia',
    FM: 'Federated States Of Micronesia',
    FL: 'Florida',
    GA: 'Georgia',
    GU: 'Guam',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MH: 'Marshall Islands',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    MP: 'Northern Mariana Islands',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PW: 'Palau',
    PA: 'Pennsylvania',
    PR: 'Puerto Rico',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VI: 'Virgin Islands',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
    Default: name
  };
  return longNames[name] || toTitleCase(longNames.Default);
};

const getIndianStateName = name => {
  const longNames = {
    AP: 'Andhra Pradesh',
    AR: 'Arunachal Pradesh',
    AS: 'Assam',
    BR: 'Bihar',
    CG: 'Chhattisgarh',
    CH: 'Chandigarh',
    DD: 'Daman and Diu',
    DH: 'Dadar Nagar Haveli',
    DL: 'Delhi',
    GA: 'Goa',
    GJ: 'Gujarat',
    HP: 'Himachal Pradesh',
    HR: 'Haryana',
    JK: 'Jammu and Kashmir',
    JH: 'Jharkhand',
    KA: 'Karnataka',
    KL: 'Kerala',
    LD: 'Lakshadweep',
    MH: 'Maharashtra',
    ML: 'Meghalaya',
    MN: 'Manipur',
    MP: 'Madhya Pradesh',
    MZ: 'Mizoram',
    NL: 'Nagaland',
    OR: 'Orissa',
    PJ: 'Punjab',
    RJ: 'Rajasthan',
    SK: 'Sikkim',
    TN: 'Tamil Nadu',
    TR: 'Tripura',
    UK: 'Uttarakhand',
    UP: 'Uttar Pradesh',
    WB: 'West Bengal',
    Default: name
  };
  return longNames[name] || toTitleCase(longNames.Default);
};

const getFlag = name => {
  const flags = {
    China: '🇨🇳',
    Italy: '🇮🇹',
    Spain: '🇪🇸',
    Iran: '🇮🇷',
    Germany: '🇩🇪',
    USA: '🇺🇸',
    UK: '🇬🇧',
    France: '🇫🇷',
    Switzerland: '🇨🇭',
    Netherlands: '🇳🇱',
    Austria: '🇦🇹',
    Australia: '🇦🇺',
    Canada: '🇨🇦',
    India: '🇮🇳',
    'S. Korea': '🇰🇷',
    'Hong Kong': '🇭🇰',
    UAE: '🇦🇪',
    'Sri Lanka': '🇱🇰',
    Default: ''
  };
  return flags[name] || flags.Default;
};

const fail = (err, msg) => {
  console.log(err);
  return {
    response_type: 'in_channel',
    text: msg || "Couldn't get stats."
  };
};

const success = async (header, fields, footer, client, country, region) => {
  const response = {
    response_type: 'in_channel',
    blocks: [
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${header}*`
          }
        },
        client
      )
    ]
  };
  const body = {
    type: 'section',
    fields: []
  };
  for (const property in fields) {
    const value = fields[property] || 0;
    body.fields.push({
      type: 'mrkdwn',
      text: `${property}:  ${isNaN(value) ? value : `*${value}*`}`
    });
  }
  const chart_url = `https://raichand-8kehpaun1bf-apigcp.nimbella.io/charts/${encodeURI(
    region ? region : country
  )}.png`;
  const chart = {
    type: 'image',
    title: {
      type: 'plain_text',
      text: country || '',
      emoji: true
    },
    image_url: `${chart_url}?${new Date().getTime()}`,
    alt_text: country || ''
  };

  const lower = {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `add _corona_stats_ to your ${client === 'msteams' ? 'Microsoft Teams' : client} with <${
          client === 'slack'
            ? 'https://nimbella.com/blog/get-live-coronavirus-stats-in-slack-with-nimbella-commander/'
            : 'https://github.com/nimbella/command-sets'
        }|Commander>.`
      }
    ]
  };
  if (footer) {
    lower.elements.push({
      type: 'mrkdwn',
      text: footer
    });
  }
  response.blocks.push(mui(body, client));
  await axios
    .head(chart_url)
    .then(r => {
      if (r.status === 200) response.blocks.push(mui(chart, client));
    })
    .catch(e => {
      console.log(`Couldn't get chart for ${region}`);
    });
  response.blocks.push(mui(lower, client));
  if (client === 'mattermost') {
    response.text = response.blocks.join('\n');
    delete response.blocks;
  }
  return response;
};

const help = client => {
  const response = {
    response_type: 'in_channel',
    blocks: [
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '*Using these commands, see stats for any country/region or worldwide.*'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '*command format*: \n`/nc corona_stats` \n`/nc corona_stats <Country Name | Abbreviation>` \n`/nc corona_stats <Country Name | Abbreviation> -r <State Name | Abbreviation>` \n`/nc corona_stats <Country Name | Abbreviation> -r <District Name>`'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*examples:*'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/nc corona_stats` : Worldwide stats'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/nc corona_stats in` : stats for India'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '`/nc corona_stats in -r up` : stats for Uttar Pradesh, India'
          }
        },
        client
      ),
      mui(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '`/nc corona_stats in -r agra` : stats for Agra District, India'
          }
        },
        client
      )
    ]
  };

  response.blocks.push(
    mui(
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `add _corona_stats_ to your ${client === 'msteams' ? 'Microsoft Teams' : client} with <${
              client === 'slack'
                ? 'https://nimbella.com/blog/get-live-coronavirus-stats-in-slack-with-nimbella-commander/'
                : 'https://github.com/nimbella/command-sets'
            }|Commander> \n data sources: <https://www.worldometers.info/coronavirus/|worldometers>, <https://www.covid19india.org/|covid19india>`
          }
        ]
      },
      client
    )
  );

  if (client === 'mattermost') {
    response.text = response.blocks.join('\n');
    delete response.blocks;
  }
  return response;
};

async function getHTMLData(url) {
  const response = await getData(url);
  return cheerio.load(response);
}

async function getData(url) {
  let response;
  try {
    response = await axios.get(url);
    if (response.status !== 200) {
      return;
    }
  } catch (err) {
    fail(err.message);
    return;
  }
  if (!response) return;
  return response.data;
}

const getDetails = (name, html) => {
  // Column Orders
  /* 
  1 #	Country,Other	
  2 Total Cases
  3 New Cases	
  4 Total Deaths
  5 New Deaths
  6 Total Recovered
  7 New Recovered
  8 Active Cases
  9 Serious, Critical
  10 Tot Cases/ 1M pop	
  11 Deaths/1M pop	
  12 Total Tests
  13 Tests/1M pop	
  14 Population
  15 Continent
  16 1 Case Every X ppl
  17 1 Death Every X ppl
  18 1 Test Every X ppl
  */
  const fields = {};
  try {
    tableParser(html);
    const stats = html(`#main_${countryDomId}`).parsetable(false, false, true);
    if (stats.length === 0) {
      return;
    }
    const recordIndex = stats[1].indexOf(name);
    if (recordIndex > 0) {
      fields['Population'] = stats[14][recordIndex];
      fields[
        'Total Cases'
      ] = `*${stats[2][recordIndex]}* \n_(per M. *${stats[10][recordIndex]}*, 1 every *${stats[16][recordIndex]}* ppl)_\n`;
      fields[
        'Total Fatalities'
      ] = `*${stats[4][recordIndex]}* \n_(per M. *${stats[11][recordIndex]}*, 1 every *${stats[17][recordIndex]}* ppl)_\n`;
      fields[
        'Total Tests'
      ] = `*${stats[12][recordIndex]}* \n_(per M. *${stats[13][recordIndex]}*, 1 every *${stats[18][recordIndex]}* ppl)_\n`;
      fields['Total Recovered'] = stats[6][recordIndex];
      fields['New Cases'] = stats[3][recordIndex];
      fields['New Fatalities'] = stats[5][recordIndex];
      fields['New Recovered'] = stats[7][recordIndex];
      fields['Active Cases'] = stats[8][recordIndex];
      fields['Critical Cases'] = stats[9][recordIndex];
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

const getDetailsForUS = (name, html) => {
  const fields = {};
  try {
    tableParser(html);
    const stats = html(`#usa_${countryDomId}`).parsetable(false, false, true);
    if (stats.length === 0) {
      return;
    }
    const recordIndex = stats[0].indexOf(name);
    if (recordIndex > 0) {
      fields[
        'Total Cases'
      ] = `*${stats[1][recordIndex]}* _(per M. *${stats[6][recordIndex]}*)_`;
      fields[
        'Total Fatalities'
      ] = `*${stats[3][recordIndex]}* _(per M. *${stats[7][recordIndex]}*)_`;
      fields[
        'Total Tests'
      ] = `*${stats[8][recordIndex]}* _(per M. *${stats[9][recordIndex]}*)_`;
      fields['New Cases'] = stats[2][recordIndex];
      fields['New Fatalities'] = stats[4][recordIndex];
      fields['Active Cases'] = stats[5][recordIndex];
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

const getDetailsForIndia = async name => {
  if (!inStatesData) {
    const stateData = await getData(`${covid19India}data.json`);
    inStatesData = stateData.statewise;
  }
  const fields = {};
  try {
    const stats = inStatesData;
    if (!stats) {
      return;
    }
    let record = stats.find(o => o.state === name);
    if (record) {
      getStateFields(fields, record);
    } else {
      if (!inDistrictData) {
        inDistrictData = await getData(
          `${covid19India}state_district_wise.json`
        );
      }
      record = Object.values(inDistrictData).find(e => e.districtData[name]);
      if (record) {
        const district = record.districtData[name];
        getDistrictFields(fields, district);
      }
    }
  } catch (e) {
    fail(e.message);
  }
  return fields;
};

function getStateFields(fields, record) {
  fields.Active = record.active;
  fields['New Active'] = record.deltaactive;
  fields.Confirmed = record.confirmed;
  fields['New Confirmed'] = record.deltaconfirmed;
  fields.Fatalities = record.deaths;
  fields['New Fatalities'] = record.deltadeaths;
  fields.Recovered = record.recovered;
  fields['New Recovered'] = record.deltarecovered;
}

function getDistrictFields(fields, record) {
  fields.Active = record.active;
  fields['New Active'] = record.delta.active;
  fields.Confirmed = record.confirmed;
  fields['New Confirmed'] = record.delta.confirmed;
  fields.Fatalities = record.deaths;
  fields['New Fatalities'] = record.delta.deaths;
  fields.Recovered = record.recovered;
  fields['New Recovered'] = record.delta.recovered;
}

/**
 * @description Live stats for the pandemic, worldwide or in a specific country/state/district.
 * @param {ParamsType} params list of command parameters
 * @param {?string} commandText text message
 * @param {!object} [secrets = {}] list of secrets
 * @return {Promise<SlackBodyType>} Response body
 */
async function _command(params) {
  let fields = {};
  let header;
  let footer;
  const client = params.__client.name;
  if (params.h || params.countryName === 'help') {
    return help(client);
  }
  let country = getCountryName((params.countryName || '').toUpperCase());
  let state = params.region;
  if (params.region) {
    if (country === 'USA') {
      state = getUSStateName(params.region.toUpperCase());
      if (!usStatesHtml) {
        usStatesHtml = await getHTMLData(`${coronaMeter}country/us/`);
        if (!usStatesHtml) {
          return fail(undefined, `Couldn't get stats for ${state}.`);
        }
      }
      fields = getDetailsForUS(state, usStatesHtml);
    }
    if (country === 'India') {
      state = getIndianStateName(params.region.toUpperCase());
      fields = await getDetailsForIndia(state);
    }
    header = `CoronaVirus 😷 Stats in ${state}, ${country} ${getFlag(
      country
    )} :`;
    if (Object.keys(fields).length === 0 && fields.constructor === Object) {
      return fail(undefined, `Couldn\'t get stats for ${state}`);
    }
    return success(header, fields, footer, client, country, state);
  }
  if (!countryHtml) {
    countryHtml = await getHTMLData(coronaMeter);
    if (!countryHtml) {
      return fail(undefined, "Couldn't get the stats");
    }
  }
  if (country) {
    if (country === 'USA') {
      footer =
        '\n to see stats for a state, type `corona_stats us -r <stateName>` e.g. `/nc corona_stats us -r ny`';
    }
    if (country === 'India') {
      footer =
        '\n to see stats for a state, type `corona_stats in -r <stateName>` e.g. `/nc corona_stats in -r up`';
    }
    header = `CoronaVirus 😷 Stats in ${country} ${getFlag(country)} :`;
    fields = getDetails(country, countryHtml);
    if (Object.keys(fields).length === 0 && fields.constructor === Object) {
      return fail(undefined, `Couldn\'t get stats for ${country}`);
    }
  } else {
    try {
      const statsElements = countryHtml('.maincounter-number');
      country = 'Worldwide';
      const stats = statsElements
        .text()
        .trim()
        .replace(/\s\s+/g, ' ')
        .split(' ');
      fields.Cases = stats[0];
      fields.Recovered = stats[2];
      fields.Fatalities = stats[1];
      header = 'CoronaVirus 😷 Stats Worldwide 🗺️ :';
      footer =
        'to see stats for a country, type `corona_stats <countryName>` e.g. `/nc corona_stats us`';
    } catch (e) {
      return fail(undefined, "Couldn't get the stats.");
    }
  }
  return success(header, fields, footer, client, country);
}

/**
 * @typedef {object} SlackBodyType
 * @property {string} text
 * @property {'in_channel'|'ephemeral'} [response_type]
 */
const main = async args => ({
  body: await _command(args.params).catch(error => ({
    response_type: 'ephemeral',
    text: `Error: ${error.message}`
  }))
});
module.exports = main;
