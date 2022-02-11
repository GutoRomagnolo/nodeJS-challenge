# Script de manipulação de registros de usuário
Este script realiza o registro de informações dos usuários. Através de alguns parâmetros, ele organiza
as informações em um arquivo JSON na saída.
#### Entrada: input.csv
#### Saída:  output.json

# Opções de configuração

O script possui um objeto de configuração de alguns parâmetros.

```JSON

{

 addressManipulation: {

 addressTypeIndex: number,

 addressTagInitialIndex: number,

},

convertToBool: {

 paramKeysToConvert: array[],

 valuesToConvertToBooleanTrue: array[]

},

 duplicatedHeader: boolean

}

```

  

### addressManipulation - Configuração p/ manipulação de endereço

A string de endereço dos inputs tem o seguinte formato: "addressType tag tag"

  

`addressTypeIndex` (number): índice que se localiza o addressType

  

`addressTagInitialIndex` (number): indice que se iniciam as tags

  

`separator` (string): separador que será usado no split para separar a string dada

  
  

### convertToBool - Selecionar atributos que se deseja converter para bool

  

`paramKeysToConvert` array[]: neste array devem ser passados os atributos do input que podem conter valores que signifiquem um valor boleano com outra representação. Por exemplo: Sim, Não, S, N, Y, N, 0, 1, Yes, No

  

`valuesToConvertToBooleanTrue` array[]: valores possíveis de entrada do usuário que devem ser verificados para atribuir o valor boolean `true`. Todos os valores que não forem naturalmente `boolean` e diferente daqueles passados neste array, serão convertidos em `false`

  

### duplicatedHeader - Flag para indicar se podem existir colunas repetidas no batch de dados

Se setada como `true`, a configuração será repassada ao parser do `csv-parser` para concatenar os dados de colunas com mesmo nome. O resultado será apenas uma key que referencia aquele grupo de colunas com um array dos valores agrupados.

# Ponto a melhorar
Otimizar a implementação do slash, transformando em uma função que se aplique em todos em casos em que haja a necessidade de separar duas informações contidas no mesmo valor. Atualmente, ela está apenas funcionando para o primeiro caso de John Appleseed, que possui dois emails, na mesma célula, separados por uma barra. A maneira aplicada atualmente não funciona de maneira genérica, mas sim de forma exata, para apenas o caso que existe no input. 
