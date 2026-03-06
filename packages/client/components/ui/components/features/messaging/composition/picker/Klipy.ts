// https://api.klipy.com/api/v1/f5DNRddwyTZbrGXnJwNkdy0CwKR5fjDy8943WADsyT5cChJaiXRjyGhkKAalPpR7/gifs/search?q=deadlock&customer_id=test0

import env from "@revolt/common/lib/env";

export class Klipy {
  private static readonly BASE_URL = new URL("https://api.klipy.com/api/v1/-");

  constructor(
    private _apikey: string,
    private _baseurl = Klipy.BASE_URL,
  ) {
    this._baseurl = new URL(`${this._apikey}/-`, this._baseurl);
  }

  async search(
    q: string,
    metadata: {
      customer_id: string;
      format_filter?: ("gif" | "webp" | "jpg" | "mp4" | "webm")[];
    },
  ) {
    const url = new URL("gifs/search", this._baseurl);
    url.searchParams.set("q", q);
    url.searchParams.set("customer_id", metadata.customer_id);
    url.searchParams.set(
      "format_filter",
      metadata.format_filter?.join(",") ?? "gif,webm",
    );
    url.searchParams.set("locale", "us");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const json = (await response.json()) as {
      data: {
        data: {
          id: number;
          slug: string;
          title: string;
          file: Record<
            "hd" | "md" | "sm" | "xs",
            Record<
              "gif" | "webp" | "jpg" | "mp4" | "webm",
              {
                url: string;
                width: number;
                height: number;
                size: number;
              }
            >
          >;
          tags: string[];
          type: string;
          blur_preview: string;
        }[];
        current_page: number;
        per_page: number;
        has_next: boolean;
        meta: {
          item_min_width: number;
          ad_max_resize_percent: number;
        };
      };
    };

    return json.data.data;
  }
}

export const klipy = new Klipy(env.STOATZATU_CONFIG.klipyApikey);
