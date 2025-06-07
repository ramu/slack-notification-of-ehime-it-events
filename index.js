// "四国方面 IT勉強会と非 IT系の合わせ技カレンダー（仮称" から愛媛県関連イベントだけ抜き出してSlack通知するGAS
// https://github.com/ramu/slack-notification-of-ehime-it-events
//
// ・main から実行してください。
// ・スクリプトプロパティに以下を設定することで通知先を設定できます。
//   - Slack関連の設定
//     - slackHookUrl: webhook url
//     - slackChannel: 通知先チャンネル名(#から入力してください。例えば #event )
//     - slackUsername: 通知ユーザ名
//     - slackIconEmoji: 通知ユーザアイコン(絵文字で指定してください。例えば :chipmunk: )

// 【設定】
// 取得対象の Google カレンダーID(今のところ固定だけど念の為定数化)
const GOOGLE_CALENDAR_ID = '38cm4t8if4qqupb6g7vbd0jna0@group.calendar.google.com';
// 現在から何日後までのイベント情報を取得するか(日数)
const ACQUISITION_INTERVAL = 14;
// スクリプトプロパティから取得する対象key
const SCRIPT_PROPERTIES_KEYS = ['slackHookUrl', 'slackChannel', 'slackUsername', 'slackIconEmoji'];
// 取得情報から除外する場所キーワード
const IGNORE_LOCATION_REGEXP = /(こうち|高知|とくしま|徳島|かがわ|香川)/i;
// 週(数値)を文字列に変換するためだけの配列
const WEEK_LIST = ['', '月', '火', '水', '木', '金', '土', '日'];

class SlackNotifier {
  // props: { slackHookUrl:, slackChannel:, slackUsername:, slackIconEmoji: }
  constructor(props) {
    Object.assign(this, props);
  }

  send(text) {
    const payload = {
      'text': text,
      'channel': this.slackChannel,
      'username': this.slackUsername,
      'icon_emoji': this.slackIconEmoji
    };
    const params = {
      'method': 'POST',
      'payload': JSON.stringify(payload)
    };
    UrlFetchApp.fetch(this.slackHookUrl, params);
  }
}

class ScriptPropertiesManager {
  constructor(keys) {
    this.keys = keys;
    this.properties = Object.fromEntries(
      keys.map(key => [key, PropertiesService.getScriptProperties().getProperty(key)])
    );
  }
  isValid() {
    return this.keys.every(key => {
      if (!this.properties[key]) {
        Logger.log('[ERROR]' + key + ' is not set.');
        return false;
      }
      return true;
    });
  }
  getProperties() {
    return this.properties;
  }
}

function main() {
  const propManager = new ScriptPropertiesManager(SCRIPT_PROPERTIES_KEYS);
  if (!propManager.isValid()) {
    return;
  }
  const scriptProperties = propManager.getProperties();
  const sendMessage = getSendMessage();

  const notifier = new SlackNotifier(scriptProperties);
  notifier.send(sendMessage);
}

function getSendMessage() {
  const eventsText = getEhimeEventsText();
  const headerText = getHeaderText(!!eventsText);
  return headerText + eventsText;
}

function getEhimeEventsText() {
  const events = getCalendarEvents();
  // カレンダーから取得した情報に対して「愛媛」や「松山」で絞り込むと ノイズが多すぎる ＆ 場所情報が未設定 の場合に拾えない。
  // 「愛媛」や「松山」で絞り込むのではなく、それ以外のキーワードで除外することで、場所未設定の情報も含め多めにイベント情報を拾っている。
  return getEventsText(events.filter(e => isEhimeLocation(e) && isEhimeTitle(e)));
}

function getCalendarEvents() {
  const today = new Date();
  const lastday = new Date();
  lastday.setDate(today.getDate() + ACQUISITION_INTERVAL);

  const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  return calendar.getEvents(today, lastday);
}

function isEhimeLocation(event) {
  return !IGNORE_LOCATION_REGEXP.exec(event.getLocation());
}

function isEhimeTitle(event) {
  return !IGNORE_LOCATION_REGEXP.exec(event.getTitle());
}

function getEventsText(events) {
  return events.map(getEventText).join('');
}

function getEventText(event) {
  let eventText = "```";
  eventText += Utilities.formatDate(event.getStartTime(),'GMT+0900', 'yyyy/MM/dd');
  eventText += '(' + WEEK_LIST[Utilities.formatDate(event.getStartTime(), 'GMT+0900', 'u')] + ')  ';
  if (!event.isAllDayEvent()) {
    eventText += Utilities.formatDate(event.getStartTime(), 'GMT+0900', 'HH:mm');
    eventText += Utilities.formatDate(event.getEndTime(), 'GMT+0900', '-HH:mm  ');
  }
  eventText += event.getTitle() + "\n";
  if (event.getDescription()) {
    eventText += formatEventDescription(event.getDescription());
  }
  // 末尾の改行を1つだけにしてから ``` を追加
  eventText = eventText.replace(/\n+$/, '\n');
  eventText += "```\n";
  Logger.log(eventText);
  return eventText;
}

function formatEventDescription(description) {
  // 本文の &nbsp; がそのまま Slack 上に表示されてしまうので除去
  description = description.replace(/&nbsp;/g, '');
  const matchedData = description.match(/<a[^>]*>(\S*)<\/[^>]*>/);
  return matchedData?.[1] || description;
}

function getHeaderText(eventsExists) {
  if (!eventsExists) {
    return "今後2週間の愛媛県内のイベント情報はありませんでした。\n";
  }

  return `今後2週間の愛媛県内のイベントをお知らせします(誤検出あり)

以下の内容は <https://sites.google.com/site/itandothershikoku/|四国方面 IT勉強会と非 IT系の合わせ技カレンダー（仮称> から抜粋しています。
抽出条件など実装を確認・変更依頼したい場合は <https://github.com/ramu/slack-notification-of-ehime-it-events|GitHub> にお願いします。

`;
}
