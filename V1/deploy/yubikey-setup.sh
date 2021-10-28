#!/bin/bash -x

# installs yubikey authentication for ec2 users
echo 'running yubkey_setup.sh'

# add/remove users here
users=( "mpratt" "davidv" "phewitt" "bradford" "kevin" )

# install yubico package
echo 'Installing Yubikey PAM support ...'
sudo rpm -qa | grep epel | while read repository;do sudo rpm -e $repository;done
sudo rpm -Uvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo yum -y install pam_yubico

# ssh config
echo 'Updating ssh configuration ...'
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo sed -i.bak 's/ChallengeResponseAuthentication no/ChallengeResponseAuthentication yes/' /etc/ssh/sshd_config
echo '' | sudo tee -a /etc/ssh/sshd_config
echo '# coinquery settings' | sudo tee -a /etc/ssh/sshd_config
echo 'ChallengeResponseAuthentication yes' | sudo tee -a /etc/ssh/sshd_config
echo 'AuthenticationMethods publickey,keyboard-interactive:pam' | sudo tee -a /etc/ssh/sshd_config
echo 'PubkeyAuthentication yes' | sudo tee -a /etc/ssh/sshd_config
echo 'AllowAgentForwarding yes' | sudo tee -a /etc/ssh/sshd_config

# require yubikey for authentication
sudo cp /etc/pam.d/sshd /etc/pam.d/sshd.bak
text='auth sufficient pam_yubico.so id=39777 key=84+4vn+4sLui++wT0sbggghgTyg= debug authfile=/etc/ssh/yubikey_mappings'
echo $text | sudo cat - /etc/pam.d/sshd > /tmp/out && sudo mv /tmp/out /etc/pam.d/sshd

sudo service sshd restart

# Give sudo privileges to CQ devs
sudo groupadd cqdevs
echo "#" | sudo EDITOR='tee -a' visudo
echo "# Add sudo access for CQ devs" | sudo EDITOR='tee -a' visudo
echo "%cqdevs        ALL=(ALL)       NOPASSWD: ALL" | sudo EDITOR='tee -a' visudo

# create user accounts
for user in "${users[@]}"
do
  # create user
  sudo useradd $user
  sudo usermod -a -G docker $user
  sudo usermod -a -G cqdevs $user
  sudo mkdir /home/$user/.ssh
  sudo chmod 700 /home/$user/.ssh

  # get pubkey
  aws s3 cp s3://pubkeys-ssh/$user-yubi-ssh.pub .
  sudo cat $user-yubi-ssh.pub | sudo tee -a /home/$user/.ssh/authorized_keys
  sudo chmod 600 /home/$user/.ssh/authorized_keys
  sudo chown -R $user /home/$user/.ssh
  
  # get token id 
  aws s3 cp s3://pubkeys-ssh/$user-yubi-tokenid.txt .
  user_tokenid=$(cat $user-yubi-tokenid.txt)
  echo "$user:$user_tokenid" | sudo tee -a /etc/ssh/yubikey_mappings
done

echo 'Finished execution of yubikey_setup.sh'