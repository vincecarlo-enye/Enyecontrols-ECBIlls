$ErrorActionPreference = 'Stop'

$configPath = 'C:\Users\Aljayve\Desktop\omni-python-service\app\config.py'
$configContent = Get-Content -Raw -Path $configPath

if ($configContent -notmatch 'CLONE_EDGE_FALLBACK_CHARS') {
    $configContent = $configContent.TrimEnd() + @"

CLONE_EDGE_FALLBACK_CHARS = int(os.getenv("CLONE_EDGE_FALLBACK_CHARS", "160"))
CLONE_PREVIEW_TTS_CHARS = int(os.getenv("CLONE_PREVIEW_TTS_CHARS", "140"))
"@
    Set-Content -Path $configPath -Value ($configContent + "`r`n")
}

$ttsPath = 'C:\Users\Aljayve\Desktop\omni-python-service\app\tts_service.py'
$ttsContent = Get-Content -Raw -Path $ttsPath

$ttsContent = $ttsContent.Replace(
    "import os`r`nimport uuid`r`nimport edge_tts`r`nimport torch",
    "import os`r`nimport re`r`nimport uuid`r`nimport asyncio`r`nimport edge_tts`r`nimport torch"
)

$ttsContent = $ttsContent.Replace(
    "from app.config import MAX_TTS_TEXT_CHARS, MAX_CLONE_TTS_TEXT_CHARS",
    "from app.config import MAX_TTS_TEXT_CHARS, MAX_CLONE_TTS_TEXT_CHARS, CLONE_EDGE_FALLBACK_CHARS, CLONE_PREVIEW_TTS_CHARS"
)

if ($ttsContent -notmatch 'def prepare_clone_preview_text') {
    $insertAfter = @"
def prepare_tts_text(text: str) -> str:
    prepared = (text or "").strip()
    if len(prepared) > MAX_TTS_TEXT_CHARS:
        prepared = prepared[:MAX_TTS_TEXT_CHARS].rsplit(" ", 1)[0].strip() or prepared[:MAX_TTS_TEXT_CHARS]
    return prepared


"@

    $replacement = @"
def prepare_tts_text(text: str) -> str:
    prepared = (text or "").strip()
    if len(prepared) > MAX_TTS_TEXT_CHARS:
        prepared = prepared[:MAX_TTS_TEXT_CHARS].rsplit(" ", 1)[0].strip() or prepared[:MAX_TTS_TEXT_CHARS]
    return prepared


def prepare_clone_preview_text(text: str) -> str:
    prepared = prepare_tts_text(text)
    if len(prepared) <= CLONE_PREVIEW_TTS_CHARS:
        return prepared

    sentences = re.split(r'(?<=[.!?])\s+', prepared)
    preview = ""

    for sentence in sentences:
        candidate = (preview + " " + sentence).strip()
        if len(candidate) > CLONE_PREVIEW_TTS_CHARS:
            break
        preview = candidate

    if preview:
        return preview

    shortened = prepared[:CLONE_PREVIEW_TTS_CHARS]
    return shortened.rsplit(" ", 1)[0].strip() or shortened


"@

    $ttsContent = $ttsContent.Replace($insertAfter, $replacement)
}

$ttsContent = $ttsContent.Replace(
    '        prepared = prepare_tts_text(text)',
    '        prepared = prepare_clone_preview_text(text)'
)

$ttsContent = $ttsContent.Replace(
    "        tts.tts_to_file(`r`n            text=prepared,`r`n            speaker_wav=REFERENCE_VOICE_PATH,`r`n            language=""en"",`r`n            file_path=output_path,`r`n        )",
    "        await asyncio.to_thread(`r`n            tts.tts_to_file,`r`n            text=prepared,`r`n            speaker_wav=REFERENCE_VOICE_PATH,`r`n            language=""en"",`r`n            file_path=output_path,`r`n        )"
)

$ttsContent = $ttsContent.Replace(
    '            "text_length": len(prepared),',
    '            "text_length": len(prepared),`r`n            "preview_mode": len(prepared) < len((text or "").strip()),'
)

if ($ttsContent -match 'if tts_mode == "clone":') {
    $ttsContent = $ttsContent.Replace(
@'    if tts_mode == "clone":
        clone_result = await synthesize_with_clone_tts(prepared)
        if clone_result.get("success"):
            return clone_result

        edge_result = await synthesize_with_edge_tts(text=prepared, voice=voice)
        edge_result["fallback_from_clone"] = True
        edge_result["clone_error"] = clone_result.get("message")
        return edge_result
'@,
@'    if tts_mode == "clone":
        if len(prepared) > CLONE_EDGE_FALLBACK_CHARS:
            edge_result = await synthesize_with_edge_tts(text=prepared, voice=voice)
            edge_result["fallback_from_clone"] = True
            edge_result["clone_error"] = f"Clone TTS skipped for long response over {CLONE_EDGE_FALLBACK_CHARS} characters."
            edge_result["preview_mode"] = True
            return edge_result

        clone_result = await synthesize_with_clone_tts(prepared)
        if clone_result.get("success"):
            return clone_result

        edge_result = await synthesize_with_edge_tts(text=prepared, voice=voice)
        edge_result["fallback_from_clone"] = True
        edge_result["clone_error"] = clone_result.get("message")
        return edge_result
'@
    )
}

Set-Content -Path $ttsPath -Value $ttsContent
