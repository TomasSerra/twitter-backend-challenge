import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { PreSignedUrl } from '@domains/post/dto';
import { Constants } from '@utils/constants';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const myS3: S3Client = new S3Client({
  apiVersion: '2006-03-01',
  credentials: {
    accessKeyId: Constants.ACCESS_KEY,
    secretAccessKey: Constants.SECRET_ACCESS_KEY,
  },
  region: Constants.BUCKET_REGION,
});

export async function generatePreSignedUrls(images: string[]): Promise<PreSignedUrl[]> {
  const preSignedUrls: PreSignedUrl[] = [];
  for (const image of images) {
    const preSignedUrl = await generatePreSignedUrl(image);
    preSignedUrls.push(preSignedUrl);
  }
  return preSignedUrls;
}

export async function generatePreSignedUrl(image: string): Promise<PreSignedUrl> {
  const ext = image.split('.').pop();
  if (!ext) {
    throw new Error(`Invalid file name: ${image}`);
  }
  const mimeType = `image/${ext}`;
  const key: string = `${randomUUID()}_${image}`;
  const s3Command = new PutObjectCommand({
    Bucket: Constants.BUCKET_NAME,
    Key: image,
    ContentType: mimeType,
  });
  const signedUrl = await getSignedUrl(myS3, s3Command, { expiresIn: Constants.PRE_SIGNED_URL_LIFETIME });

  return { signedUrl, key };
}
