<p align="center"><b>VK2Discord</b></p>
<p align="center">Публикация постов из VK в Discord с полным покрытием вложений к ним.</p>
<p align="center">
  <a href="https://github.com/MrZillaGold/VK2Discord/wiki/%D0%98%D0%BD%D1%81%D1%82%D1%80%D1%83%D0%BA%D1%86%D0%B8%D1%8F">Инструкция по настройке</a> | <a href="https://vk.com/id233731786">По всем вопросам</a>
</p>

<p align="center">
  Перед началом работы настройте config.json!
</p>
<p align="center">
  <a href="https://heroku.com/deploy">
    <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy">
  </a>
</p>
<p align="center"><a href="https://www.codefactor.io/repository/github/mrzillagold/vk2discord"><img src="https://www.codefactor.io/repository/github/mrzillagold/vk2discord/badge" alt="CodeFactor" /></a></p>

```js
{
  "token": "Токен", // Токен от любой страницы ВКонтакте, получить можно тут: https://vk.cc/9bJ69C
  "group_id": -1, // ID группы ВКонтакте из которой брать новости.
  "webhook_url": "https://discordapp.com/api/webhooks/", // Ваш WebHook URL.
  "bot_name": "VK2Discord", // Имя вашего WebHook, выcвечиваетеся в качестве имени бота.
  "color": "#aabbcc", // Цвет рамки сообщения Discord в формате HEX.
  "keywords": ["#новости@VK2DISCORD", "Привет", "яБлоКо"], // Ключевые слова, через запятую, для публикации записи. Если этого слова нет в тексте - запись не будет опубликована. Рекомендую использовать ТОЛЬКО с навигационными хештегами по типу: #news@stevebotmc. Оставьте массив пустым, если не хотите использовать данную функцию.
  "filter": true, // Публиковать посты только от именни группы, посты от обычных пользователей пропускаются. true = Вкл. / false = Выкл. 
  "interval": 10000 // Интервал получения новых постов из ВКонтакте в миллисекундах.
}
```

<p align="center"><img src="https://repository-images.githubusercontent.com/192033596/2c44de80-d8b2-11e9-9fc5-03e288f8da72"></p>
