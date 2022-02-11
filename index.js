const { parse } = require('csv-parse')

const fs = require('fs');
const _ = require('lodash');

const inputFile = 'input.csv';

const config = {
  addressManipulation: {
    addressTypeIndex: 0,
    addressTagInitialIndex: 1,
    separator: ' '
  },
  convertToBool: {
    paramKeysToConvert: ['invisible', 'see_all'],
    valuesToConvertToBooleanTrue: ['yes']
  },
  duplicatedHeader: true
}

// Initialize the parser
const parser = parse({
  columns: true,
  group_columns_by_name: config.duplicatedHeader
});

const recordsFromFile = []

const convertParamToBool = (paramValue) => {
  // TODO: faltou identificar valores que podem ser identificados como bool. 
  return !!_.find(config.convertToBool.valuesToConvertToBooleanTrue, (value) => {
    return paramValue === value
  })
}

const mapDataToPrint = ({columnKeys, dataToMap, name}) => {
  const addressesData = [];
  let mapped = {};
  const isDataToMapAnArray = dataToMap.length > 1 

  // se dataToMap for um array, significa que existe mais de um registro para o mesmo nome
  // portanto pode ocorrer mais de um valor para cada address key, referente a cada registro
  let objectToMap = isDataToMapAnArray ? _.assign(...dataToMap) : dataToMap
  _.forEach(columnKeys, (key) => {
    // split para identificar os keys que serão mapeados para address, tag e type.
    const splittedParamName = key.split(config.addressManipulation.separator);
    const isParamAnAddress = splittedParamName.length > 1
    // se o array tem tamanho maior que 1, significa que o parametro possui strings separadas por espaço
    if(isParamAnAddress) {
      const addressType = splittedParamName[config.addressManipulation.addressTypeIndex]
      const tags = 
        splittedParamName.slice(
          config.addressManipulation.addressTagInitialIndex, 
          splittedParamName.length
        )
      const addressValue = objectToMap[key] // pode ser array ou pode ser string
      // console.log({name, key, addressValue, isDataToMapArray})
      // retirar valores vazios dos endereços resultantes do split.
      const cleanedAddressesValues = isDataToMapAnArray ? _.compact(addressValue) : addressValue;

      // se após o compact existir mais de uma posiçao, considerei o valor válido para o map.
      if(isDataToMapAnArray) {
        _.forEach(cleanedAddressesValues, (value) => {
          // podem existir valores separados por barra. 
          const slashedValues = value.split('/');
          // se o resultado do split.length > 1, existem resultados para separar.
          if(slashedValues.length > 1) {
            _.forEach(slashedValues, (splittedValue) => {
               addressesData.push({
                type: addressType,
                tags,
                address: splittedValue
              })
            })
          } else {
            addressesData.push({
              type: addressType,
              tags,
              address: value
            })
          }
        })
      } else {
        const slashedValues = cleanedAddressesValues.split('/');
          // se o resultado do split.length > 1, existem resultados para separar.
        if(slashedValues.length > 1) {
          _.forEach(slashedValues, (splittedValue) => {
              addressesData.push({
              type: addressType,
              tags,
              address: splittedValue
            })
          })
        } else {
          addressesData.push({
            type: addressType,
            tags,
            address: cleanedAddressesValues
          })
        }
      }
    } else {
      const convertToBool = 
        _.find(config.convertToBool.paramKeysToConvert, (param) => param === key)
      mapped = {
        ...mapped,
        [key]: convertToBool ? convertParamToBool(objectToMap[key]) : objectToMap[key] // eid: '1212'
      }
    }
  })
  return {
    ...mapped,
    addresses: addressesData
  }
}

fs.createReadStream(__dirname + '/' + inputFile)
  .pipe(parser)
// Use the readable stream api to consume records
parser.on('readable', function() {
  let record;
  while ((record = parser.read()) !== null) {
    recordsFromFile.push(record);
  }
});

parser.on('end', function(){
  // assumindo keys sempre iguais para todos os records:
  // salvar headers 
  const columnKeys = _.keys(recordsFromFile[0]);

  // salvar os nomes presentes nos registros para fazer o map pelo nome.
  const allNamesFromTheList = _.map(recordsFromFile, (item) => item.fullname)

  // remover duplicatas
  const uniqueNamesFromTheList = _.uniqBy(allNamesFromTheList)

  // mapear a partir dos nomes
  const mapDataToNames = _.map(uniqueNamesFromTheList, (name) => {
    // para cada name da lista encontrada: 

    // 1 - filtrar registros por nome na lista de registros
    // podem existir mais de um registro para um mesmo nome, por isso utiliza-se filter
    const filteredResultsByName = _.filter(recordsFromFile, (result) => { //array
      return result.fullname === name;
    })

    // 2 - caso tenha mais de um resultado, unificar resultados em um só
    if (filteredResultsByName.length > 1) {
      // 3 - mapear resultados a partir dos headers
      // o resultado será um array de objetos, onde cada atributo é uma key com seus respectivos resultados
      const mappedByDataKeys = _.map(columnKeys, (key) => {
        let dataByKey = []

        // p/ cada resultado do array de resultados, buscar a key no resultado e salvar no array
        _.forEach(filteredResultsByName, (result) => {
          dataByKey.push(result[key])
        })

        // remover duplicatas e verificar o tamanho do array resultante
        // caso o resultado retorne mais de um, significa que existem dois valores para o mesmo key
        // ou seja, os valores devem ser considerados para o map
        const uniqueDataItem = _.uniqBy(dataByKey);
        
        // aqui o map retorna a posição 0 do array uniqueDataItem para os resultados duplicados
        // e retorna todos os resultados para os não duplicados
        return {
          [key]: uniqueDataItem.length > 1 ? uniqueDataItem : uniqueDataItem[0]
        }
      })

      return mapDataToPrint({columnKeys, dataToMap: mappedByDataKeys, name})
    } else {
      return mapDataToPrint({columnKeys, dataToMap: filteredResultsByName[0], name})
    }
  })

  let dataToSave = JSON.stringify(mapDataToNames);
  fs.writeFile("output.json", dataToSave, function(err) {
    if (err) {
      console.log(err);
    }
  });
});
