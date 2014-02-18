#! /usr/bin/env python
import os
from setuptools import setup

import allink_frontend_editor
setup(
    name='allink_frontend_editor',
    version=allink_frontend_editor.__version__,
    description='django based newsletter toolkit',
    long_description=open(os.path.join(os.path.dirname(__file__), 'README.rst')).read(),
    author='allink GmbH',
    author_email='itcrowd@allink.ch',
    url='http://github.com/allink/allink_frontend_editor/',
    license='BSD License',
    platforms=['OS Independent'],
    packages=[
        'allink_frontend_editor',
        'allink_frontend_editor.templatetags',
    ],
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
    ],
    requires=[
        'FeinCMS(>=1.5.0)',
        'Django(>=1.5)',
    ],
    include_package_data=True,
)
