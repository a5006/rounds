$ErrorActionPreference = 'Stop'
$taskAudioDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../assets/audio'))
New-Item -ItemType Directory -Force -Path $taskAudioDir | Out-Null
$taskSpeech = New-Object -ComObject SAPI.SpVoice
$taskChineseVoice = @($taskSpeech.GetVoices()) | Where-Object { $_.GetDescription() -match 'Huihui|Chinese' } | Select-Object -First 1
if (-not $taskChineseVoice) { throw 'A Chinese Windows SAPI voice is required to regenerate the bundled Chinese announcements.' }
$taskSpeech.Voice = $taskChineseVoice
$taskSpeech.Rate = 2
$taskLines = @{ 'prep' = '准备训练'; 'rest' = '回合结束，休息'; 'done' = '训练完成'; 'number-3' = '三'; 'number-2' = '二'; 'number-1' = '一' }
1..30 | ForEach-Object { $taskLines["round-$_"] = "第 $_ 回合，开始" }
foreach ($taskEntry in $taskLines.GetEnumerator()) {
  $taskAudioPath = Join-Path $taskAudioDir ($taskEntry.Key + '.wav')
  $taskStream = New-Object -ComObject SAPI.SpFileStream
  $taskFormat = New-Object -ComObject SAPI.SpAudioFormat
  $taskFormat.Type = 22
  $taskStream.Format = $taskFormat
  $taskStream.Open($taskAudioPath, 3, $false)
  $taskSpeech.AudioOutputStream = $taskStream
  $null = $taskSpeech.Speak($taskEntry.Value)
  $taskStream.Close()
}
Write-Output "Generated $($taskLines.Count) offline Chinese voice clips."
