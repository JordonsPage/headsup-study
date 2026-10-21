import base64
import io
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import parser

class ParserTests(unittest.TestCase):
    def test_compression_reaches_limit_even_after_minimum_quality(self):
        image = Image.effect_noise((600, 600), 100).convert('RGB')
        with patch.object(parser, 'MAX_IMAGE_BYTES', 2000):
            encoded = parser._encode_image(image)
        data = base64.b64decode(encoded)
        self.assertLessEqual(len(data), 2000)
        with Image.open(io.BytesIO(data)) as result:
            self.assertEqual(result.format, 'JPEG')
            self.assertLess(result.width, 600)

    def test_plain_text(self):
        self.assertEqual(parser.extract_text('notes.txt', b'Neuron: nerve cell'), 'Neuron: nerve cell')

if __name__ == '__main__':
    unittest.main()
