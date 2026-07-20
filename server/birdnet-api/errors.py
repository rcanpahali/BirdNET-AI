"""Domain errors the API translates into structured JSON responses.

Never leak raw exception text to callers -- log full details server-side
and return a stable error code + message instead.
"""


class AnalyzerServiceError(Exception):
    status_code = 500
    error_code = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UnsupportedFileType(AnalyzerServiceError):
    status_code = 400
    error_code = "unsupported_file_type"


class EmptyUpload(AnalyzerServiceError):
    status_code = 400
    error_code = "empty_upload"


class FileTooLarge(AnalyzerServiceError):
    status_code = 400
    error_code = "file_too_large"


class AudioDecodingError(AnalyzerServiceError):
    status_code = 400
    error_code = "audio_decoding_error"
