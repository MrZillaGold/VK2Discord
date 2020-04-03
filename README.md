<p align="center"><b>VK2Discord</b></p>
<p align="center">Публикация постов из группы или профиля VK в Discord с полным покрытием вложений к ним.</p>
<p align="center">
  <a href="https://github.com/MrZillaGold/VK2Discord/wiki/%D0%98%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%86%D0%B8%D1%8F">Инструкция по настройке</a> | <a href="https://vk.com/id233731786">По всем вопросам</a>
</p>

<p align="center">
  Перед началом работы настройте config.json!
  <br/>
  Скрипт запускается командой <b>npm start</b>!
</p>
<p align="center"><a href="https://www.codefactor.io/repository/github/mrzillagold/vk2discord"><img src="https://www.codefactor.io/repository/github/mrzillagold/vk2discord/badge" alt="CodeFactor" /></a></p>

```js
{
  "vk": {
    "token": "токен", // Токен от страницы (получить можно тут https://vk.cc/9bJ69C) или группы ВКонтакте
    "group_id": "public1", // ID группы или пользователя ВКонтакте от которого брать новости.
    "keywords": [], // Ключевые слова, через запятую, для публикации записи. Если этого слова нет в тексте - запись не будет опубликована. Рекомендую использовать ТОЛЬКО с навигационными хештегами по типу: #news@stevebotmc. Оставьте массив пустым, если не хотите использовать данную функцию.
    "filter": true, // Публиковать посты только от именни группы, посты от обычных пользователей пропускаются. true = Вкл. / false = Выкл. 
    "longpoll": false // Использовать Longpoll API. true = Вкл. / false = Выкл.
  },
  "discord": {
    "webhook_urls": [
         "https://discordapp.com/api/webhooks/",
         "https://discordapp.com/api/webhooks/",
         ...
    ], // Ссылки на Webhook, можно использовать несколько ссылок на разные каналы Discord.
    "bot_name": "VK2DISCORD", // Имя вашего WebHook, выcвечиваетеся в качестве имени бота.
    "color": "#aabbcc" // Цвет рамки сообщения Discord в формате HEX.
  },
  "interval": 30 // Интервал получения новых постов из ВКонтакте в секундах.
}
```

<p align="center">
  <b>VK2Discord</b> используют крупные Discord сервера
</p>

<table>
  <tr>
    <td align="center">
      <a href="https://discord.gg/deadbydaylight">
        <img src="https://i.imgur.com/bjGpT8Y.jpg" width="100px;" alt="Dead by Daylight"/>
        <br/>
      <sub><b>Dead by Daylight</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://vk.com/wotclue">
        <img src="https://i.imgur.com/04eVG0k.jpg" width="100px;" alt="Dead by Daylight"/>
        <br/>
      <sub><b>WOT Express</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://discord.gg/tAca6dX">
        <img src="https://i.imgur.com/ExjWQCI.png" width="100px;" alt="Dead by Daylight"/>
        <br/>
      <sub><b>MINECRAFT RU</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://discord.gg/MfKUp4F">
        <img src="https://i.imgur.com/FuI3ONC.jpg" width="100px;" alt="Dead by Daylight"/>
        <br/>
      <sub><b>VTC QuickFire Corp.</b></sub>
      </a>
    </td>
    </tr>
</table>

<p align="center">
  <img src="https://repository-images.githubusercontent.com/192033596/2c44de80-d8b2-11e9-9fc5-03e288f8da72">
</p>

***

<p align="center">
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
  <img alt="Лицензия Creative Commons" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png"/>
  </a>
  <br/>
  VK2DISCORD доступен по 
  <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">
    лицензии Creative Commons «Attribution-NonCommercial-ShareAlike» («Атрибуция —  Некоммерческое использование — На тех же условиях») 4.0 Всемирная</a>.
</p>
