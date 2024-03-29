USER=yaskevich
APP=signs
BRANCH=master
PROD=production
DIR=$(pwd)
WORK=$DIR/$PROD/$APP

pm2 delete $APP
rm -rf $DIR/$PROD/$APP
# degit $USER/$APP#$BRANCH $WORK
git clone https://github.com/$USER/$APP  $WORK --depth 1
HASH=$(git -C $WORK rev-parse --short HEAD)
UNIX=$(git -C $WORK log -1 --format=%ct)
# echo $HASH

rm $WORK/* 2>/dev/null
rm $WORK/.* 2>/dev/null
rm $WORK/parser -rf
rm $WORK/.git -rf
npm install --prefix $WORK/client
npm run build  --prefix $WORK/client
mv $WORK/client/dist $WORK/public

cd $WORK/server
for i in *
do
  if [ -f "$i" ]; then
    mv "$i" $WORK
  fi
done

mv $WORK/server/connectors $WORK

npm install --prefix $WORK
cp $DIR/$APP.env $WORK/.env
printf "\nCOMMIT=%s" $HASH >> $WORK/.env
printf "\nCOMMITUNIX=%s" $UNIX >> $WORK/.env

cd $WORK
rm -rf $WORK/client $WORK/server

if [ -d $DIR/media ] 
then
    ln -s $DIR/media $WORK/media
    echo "Soft link for media directory was created"
else
    echo "Directory for media was not found!"
fi



# # https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
# # --cwd
pm2 start ecosystem.config.cjs --cwd $WORK
pm2 save
