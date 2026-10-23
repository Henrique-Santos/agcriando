using NetVips;

namespace AgCriando.Api.Tests.Support;

public static class TestImages
{
    public static byte[] Jpeg(int width, int height)
    {
        using var image = Image.Black(width, height, bands: 3);
        return image.JpegsaveBuffer();
    }
}
