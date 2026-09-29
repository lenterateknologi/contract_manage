<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a standardized success JSON response.
     *
     * @param  mixed  $data
     * @param  string  $message
     * @param  int  $code
     * @param  array  $meta
     * @return JsonResponse
     */
    public function successResponse(mixed $data = null, string $message = 'Success', int $code = 200, array $meta = []): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ];

        if (! empty($meta)) {
            $response = array_merge($response, $meta);
        }

        return response()->json($response, $code);
    }

    /**
     * Return a standardized error JSON response.
     *
     * @param  string  $message
     * @param  int  $code
     * @param  mixed  $errors
     * @param  mixed  $data
     * @return JsonResponse
     */
    public function errorResponse(string $message = 'Error', int $code = 400, mixed $errors = null, mixed $data = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ];

        return response()->json($response, $code);
    }
}
