<?php

namespace App\Services;

use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

/** Small XLSX reader/writer for tabular data. No formulas or external links are evaluated. */
class ExcelWorkbookService
{
    public function read(string $path, ?string $sheetName = null): array
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('Ekstensi PHP ZipArchive tidak tersedia di server.');
        }
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new RuntimeException('File bukan workbook .xlsx yang valid.');
        }
        try {
            if ($zip->numFiles > 300) {
                throw new RuntimeException('Workbook terlalu kompleks.');
            }
            $workbook = $this->xml($zip, 'xl/workbook.xml');
            $rels = $this->xml($zip, 'xl/_rels/workbook.xml.rels');
            $targets = [];
            foreach ($rels->Relationship as $relation) {
                $targets[(string) $relation['Id']] = (string) $relation['Target'];
            }
            $sheets = [];
            foreach ($workbook->sheets->sheet as $sheet) {
                $attributes = $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
                $id = (string) $attributes['id'];
                $target = $targets[$id] ?? '';
                if ($target === '' || str_contains($target, '..')) {
                    continue;
                }
                $sheets[(string) $sheet['name']] = str_starts_with($target, '/')
                    ? ltrim($target, '/') : 'xl/' . ltrim($target, '/');
            }
            if (!$sheets) {
                throw new RuntimeException('Worksheet tidak ditemukan.');
            }
            $chosen = $sheetName ?: array_key_first($sheets);
            if (!isset($sheets[$chosen])) {
                throw new RuntimeException('Worksheet yang dipilih tidak ditemukan.');
            }
            $strings = [];
            if ($zip->locateName('xl/sharedStrings.xml') !== false) {
                $shared = $this->xml($zip, 'xl/sharedStrings.xml');
                foreach ($shared->si as $item) {
                    $strings[] = trim((string) $item->t ?: implode('', array_map(
                        static fn ($run) => (string) $run->t, iterator_to_array($item->r)
                    )));
                }
            }
            $xml = $this->xml($zip, $sheets[$chosen]);
            $rows = [];
            foreach ($xml->sheetData->row ?? [] as $row) {
                if (count($rows) >= 10001) {
                    throw new RuntimeException('Maksimum 10.000 baris data per import.');
                }
                $cells = [];
                foreach ($row->c as $cell) {
                    $ref = (string) $cell['r'];
                    preg_match('/^[A-Z]+/', $ref, $match);
                    $column = 0;
                    foreach (str_split($match[0] ?? '') as $letter) {
                        $column = $column * 26 + ord($letter) - 64;
                    }
                    if ($column < 1 || $column > 256) {
                        throw new RuntimeException('Worksheet memiliki terlalu banyak kolom.');
                    }
                    $type = (string) $cell['t'];
                    $value = match ($type) {
                        's' => $strings[(int) $cell->v] ?? '',
                        'inlineStr' => (string) $cell->is->t,
                        default => (string) $cell->v,
                    };
                    $cells[$column - 1] = $value;
                }
                if ($cells) {
                    $max = max(array_keys($cells));
                    $rows[] = array_replace(array_fill(0, $max + 1, ''), $cells);
                }
            }
            return ['sheet' => $chosen, 'sheets' => array_keys($sheets), 'rows' => $rows];
        } finally {
            $zip->close();
        }
    }

    private function xml(ZipArchive $zip, string $name): SimpleXMLElement
    {
        $index = $zip->locateName($name);
        if ($index === false || ($zip->statIndex($index)['size'] ?? 0) > 12_000_000) {
            throw new RuntimeException('Struktur workbook tidak valid atau terlalu besar.');
        }
        $data = $zip->getFromIndex($index);
        $xml = simplexml_load_string($data, SimpleXMLElement::class, LIBXML_NONET);
        if ($xml === false) {
            throw new RuntimeException('XML workbook tidak valid.');
        }
        return $xml;
    }

    public function write(array $headers, array $rows): string
    {
        if (!class_exists(ZipArchive::class)) {
            throw new RuntimeException('Ekstensi PHP ZipArchive tidak tersedia di server.');
        }
        $tempDir = sys_get_temp_dir();
        if (!is_dir($tempDir) || !is_writable($tempDir)) {
            throw new RuntimeException('Direktori temporary server tidak dapat ditulis.');
        }
        $path = tempnam($tempDir, 'eraport_xlsx_');
        if ($path === false) {
            throw new RuntimeException('Gagal membuat file temporary.');
        }
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Gagal membuat file Excel.');
        }
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
        $sheet = '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        foreach (array_merge([$headers], $rows) as $rowIndex => $row) {
            $sheet .= '<row r="' . ($rowIndex + 1) . '">';
            foreach (array_values($row) as $index => $value) {
                $number = $index + 1;
                $column = '';
                while ($number > 0) {
                    $number--;
                    $column = chr(65 + $number % 26) . $column;
                    $number = intdiv($number, 26);
                }
                // Always write text: NIS/NISN and codes retain leading zeroes; formulas remain inert.
                $safe = htmlspecialchars((string) ($value ?? ''), ENT_XML1 | ENT_QUOTES, 'UTF-8');
                $sheet .= '<c r="' . $column . ($rowIndex + 1) . '" t="inlineStr"><is><t xml:space="preserve">' . $safe . '</t></is></c>';
            }
            $sheet .= '</row>';
        }
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet . '</sheetData></worksheet>');
        $zip->close();
        return $path;
    }
}
