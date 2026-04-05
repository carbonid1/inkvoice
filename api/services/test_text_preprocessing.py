from api.services.text_preprocessing import normalize_ellipsis


class TestNormalizeEllipsis:
    def test_collapses_spaced_dots_in_prose(self):
        text = (
            "Nameless Ones . . . Priests of the Azath. "
            "Myself . . . Icarium . . . these two twisted roots . . . "
            "journeying to Tremorlor"
        )
        result = normalize_ellipsis(text)
        assert result == (
            "Nameless Ones ... Priests of the Azath. "
            "Myself ... Icarium ... these two twisted roots ... "
            "journeying to Tremorlor"
        )

    def test_leaves_standard_ellipsis_untouched(self):
        assert normalize_ellipsis("Hello... world") == "Hello... world"

    def test_leaves_unicode_ellipsis_untouched(self):
        assert normalize_ellipsis("Hello\u2026 world") == "Hello\u2026 world"

    def test_leaves_single_periods_untouched(self):
        assert normalize_ellipsis("End of sentence. Start of next.") == "End of sentence. Start of next."

    def test_leaves_text_without_dots_untouched(self):
        assert normalize_ellipsis("No dots here") == "No dots here"

    def test_collapses_four_spaced_dots(self):
        assert normalize_ellipsis("Wait . . . . really") == "Wait ... really"
