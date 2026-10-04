using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace AgCriando.Domain.Common;

public static partial class Slug
{
    public static string From(string text)
    {
        var decomposed = (text ?? string.Empty).Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        return NonAlphanumeric().Replace(builder.ToString().ToLowerInvariant(), "-").Trim('-');
    }

    public static string Unique(string baseSlug, Func<string, bool> exists)
    {
        if (!exists(baseSlug)) return baseSlug;
        for (var i = 2; ; i++)
        {
            var candidate = $"{baseSlug}-{i}";
            if (!exists(candidate)) return candidate;
        }
    }

    public static string WithTimestamp(string text, DateTimeOffset now, string fallback = "produto")
    {
        var slug = From(text);
        return $"{(slug.Length == 0 ? fallback : slug)}-{ToBase36(now.ToUnixTimeMilliseconds())}";
    }

    private static string ToBase36(long value)
    {
        const string digits = "0123456789abcdefghijklmnopqrstuvwxyz";
        if (value == 0) return "0";
        var chars = new Stack<char>();
        while (value > 0)
        {
            chars.Push(digits[(int)(value % 36)]);
            value /= 36;
        }
        return new string(chars.ToArray());
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();
}
