
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">Сервис для получения данных о токене JUP, используя Node.js и фреймворк NestJS.</p>
<p align="center">

</p>

## Описание

Этот сервис предоставляет API для получения данных о токене JUP. Он позволяет пользователю получить информацию о ликвидности токена, деталях последней транзакции, номере слота, кошельке и сумме транзакции.

## Cтек
* NestJS (C последней версией NodeJS LTS)
* Typescript
* @solana/web3.js


## Установка

```bash
$ npm install
```

## Запуск приложения

```bash
$ npm run start
```

## Логика работы алгоритма

### Получение ликвидности
1. Используется API Dexscreener для получения информации о ликвидности токена JUP.
2. Отправляется GET-запрос на `DEXSCREENER_API_URL` с адресом токена `TOKEN_ADDRESS`.
3. В ответе API извлекаются торговые пары, и среди них ищется пара с USDC.
4. Если такая пара найдена, извлекается ликвидность в USD.

### Получение последней транзакции покупки
1. Используется Solana RPC API для получения данных о транзакциях.
2. С помощью `TOKEN_ADDRESS` и библиотеки `@solana/web3.js` получаются последние подписи транзакций. (* захардкодил получение 25 последних)
3. Для каждой транзакции проверяется, содержит ли она информацию о метаданных и балансе токенов до и после транзакции.
4. Находится транзакция, в которой количество токенов JUP увеличилось.
5. Проверяется, что количество другого токена уменьшилось у того же владельца.
6. Извлекаются данные о слоте, кошельке и сумме транзакции.

## Описание API

### GET /token

Возвращает JSON объект с данными о токене JUP:
- `liquidity`: Ликвидность в USD
- `lastTransaction`: Подпись последней транзакции
- `slot`: Номер слота последней транзакции
- `wallet`: Кошелек
- `transactionAmount`: Сумма транзакции

#### Пример ответа:

```json
{
  "liquidity": 5000,
  "lastTransaction": "5gK9A...q3L9",
  "slot": 12345678,
  "wallet": "8fjsk...FJ3k",
  "transactionAmount": 100
}
```
