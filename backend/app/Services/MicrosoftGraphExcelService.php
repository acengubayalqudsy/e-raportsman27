<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class MicrosoftGraphExcelService
{
    private const BASE = 'https://graph.microsoft.com/v1.0';

    private function get(string $token, string $path): array
    {
        $response = Http::withToken($token)->acceptJson()->timeout(25)->get(self::BASE . $path);
        if (!$response->successful()) {
            throw new RuntimeException('Microsoft Graph menolak permintaan (' . $response->status() . '). Periksa izin Files.ReadWrite dan akses file.');
        }
        return $response->json() ?: [];
    }

    public function files(string $token, ?string $folderId = null): array
    {
        $path = $folderId ? '/me/drive/items/' . rawurlencode($folderId) . '/children' : '/me/drive/root/children';
        $path .= '?$top=200&$select=id,name,file,folder';
        $files = [];
        for ($page = 0; $path && $page < 20; $page++) {
            $data = $this->get($token, $path);
            foreach ($data['value'] ?? [] as $item) {
                if (isset($item['folder']) || str_ends_with(strtolower($item['name'] ?? ''), '.xlsx')) $files[] = $item;
            }
            $next = $data['@odata.nextLink'] ?? null;
            if ($next && !str_starts_with($next, self::BASE . '/me/drive/')) {
                throw new RuntimeException('Alamat halaman OneDrive tidak valid.');
            }
            $path = $next ? substr($next, strlen(self::BASE)) : null;
        }
        if ($path) throw new RuntimeException('Folder OneDrive terlalu besar untuk ditampilkan sekaligus. Pilih folder yang lebih kecil.');
        return $files;
    }

    public function worksheets(string $token, string $fileId): array
    {
        $data = $this->get($token, '/me/drive/items/' . rawurlencode($fileId) . '/workbook/worksheets');
        return array_map(static fn ($sheet) => ['id' => $sheet['id'] ?? '', 'name' => $sheet['name'] ?? ''], $data['value'] ?? []);
    }

    public function usedRange(string $token, string $fileId, string $sheetName): array
    {
        $data = $this->get($token, '/me/drive/items/' . rawurlencode($fileId)
            . '/workbook/worksheets/' . rawurlencode($sheetName) . '/usedRange(valuesOnly=true)');
        $rows = $data['values'] ?? [];
        if (count($rows) > 10001 || count($rows[0] ?? []) > 256) {
            throw new RuntimeException('Workbook melampaui batas import (10.000 baris, 256 kolom).');
        }
        return $rows;
    }
}
