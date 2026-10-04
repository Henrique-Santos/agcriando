using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;

namespace AgCriando.Api.Tests.Support;

public static class TestImages
{
    public static byte[] Jpeg(int width, int height, ushort? exifOrientation = null)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(214, 0, 108));
        if (exifOrientation is { } orientation)
        {
            image.Metadata.ExifProfile = new ExifProfile();
            image.Metadata.ExifProfile.SetValue(ExifTag.Orientation, orientation);
        }
        using var output = new MemoryStream();
        image.SaveAsJpeg(output);
        return output.ToArray();
    }
}
